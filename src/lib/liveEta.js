// ═══════════════════════════════════════════
// LIVE ETA MODEL
// ═══════════════════════════════════════════
// Crowd-sourced arrival estimates. Riders report the stop they boarded at
// ("I got on at דת"ק 13 on the 14:30"); from those reports we learn, per route
// and per stop, how many minutes after the scheduled departure the bus
// actually reaches that stop. The learned offsets then drive two things:
//   1. a static estimate — "the 14:30 usually reaches your stop around 14:41"
//   2. a live estimate — once someone reports today's bus, we know how late it
//      is running and shift every remaining stop by that delta.
//
// Pure functions only: this module is imported by both the serverless API
// (which builds the model from the last week of reports) and by app.js (which
// turns the model plus today's reports into the times shown on screen).

// Reports are kept for one week; nothing older feeds the model.
export const RETENTION_DAYS = 7;
// A report stops counting as "live" after this long — by then the bus is gone.
export const LIVE_WINDOW_MINUTES = 90;
// How long a reported bus keeps driving the ETA of its own trip.
export const TRIP_ACTIVE_MINUTES = 75;
// Below this many samples a stop leans on the route's fitted line instead.
export const MIN_SAMPLES_PER_STOP = 2;
// Recency weighting: a report from `HALF_LIFE_DAYS` ago counts half as much.
export const HALF_LIFE_DAYS = 3;

// Sane defaults for a route we have never seen a report for: a base shuttle
// leaves a minute or so late and spends ~1.6 minutes between stops.
export const DEFAULT_START_DELAY = 1;
export const DEFAULT_PACE_PER_STOP = 1.6;
// Physical floor: no shuttle clears a stop in under half a minute. Without it,
// reports that happen to cluster at one moment would flatten a route's fitted
// pace and stack every remaining stop onto the same minute.
const MIN_PACE_PER_STOP = 0.5;

// Offsets outside this band are someone mis-tapping, not a real observation.
export const MIN_VALID_OFFSET = -20;
export const MAX_VALID_OFFSET = 180;

/**
 * Is this report plausible for the departure it names?
 *
 * The model already ignores implausible offsets; a sighting the model threw
 * out must not still be drawn on screen as a bus, or the app ends up claiming
 * the 14:30 is sitting at a stop at 17:37. Same rule, one place.
 */
export function isPlausibleReport(tripTime, minutesOfDay) {
  const scheduled = toMinutes(tripTime);
  const observed = Number(minutesOfDay);
  if (scheduled === null || !isFinite(observed)) return false;
  let offset = observed - scheduled;
  if (offset < -720) offset += 1440;
  return offset >= MIN_VALID_OFFSET && offset <= MAX_VALID_OFFSET;
}

export function toMinutes(timeStr) {
  if (typeof timeStr !== "string") return null;
  const m = timeStr.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

export function formatMinutesOfDay(mins) {
  if (mins === null || mins === undefined || !isFinite(mins)) return "";
  const rounded = Math.round(mins);
  const wrapped = ((rounded % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
}

// Weighted median — robust to the odd rider who reports ten minutes after
// actually boarding, which a mean would happily absorb.
function weightedMedian(pairs) {
  if (pairs.length === 0) return null;
  const sorted = [...pairs].sort((a, b) => a.value - b.value);
  const total = sorted.reduce((sum, p) => sum + p.weight, 0);
  if (total <= 0) return sorted[Math.floor(sorted.length / 2)].value;
  let acc = 0;
  for (const p of sorted) {
    acc += p.weight;
    if (acc >= total / 2) return p.value;
  }
  return sorted[sorted.length - 1].value;
}

// Median absolute deviation, in the same units as the values: how much riders
// disagree about this stop.
function medianAbsDeviation(pairs, center) {
  if (pairs.length === 0) return null;
  const devs = pairs.map((p) => ({
    value: Math.abs(p.value - center),
    weight: p.weight,
  }));
  return weightedMedian(devs);
}

function recencyWeight(ageDays) {
  const age = Math.max(0, Number(ageDays) || 0);
  return Math.pow(0.5, age / HALF_LIFE_DAYS);
}

// Weighted least-squares fit of offset ≈ intercept + slope × stopIndex.
// The per-stop medians are the points; a stop backed by twenty reports should
// pull the line harder than one backed by two.
function fitLine(points) {
  const n = points.reduce((s, p) => s + p.weight, 0);
  if (points.length < 2 || n <= 0) return null;
  const meanX = points.reduce((s, p) => s + p.x * p.weight, 0) / n;
  const meanY = points.reduce((s, p) => s + p.y * p.weight, 0) / n;
  let num = 0;
  let den = 0;
  for (const p of points) {
    num += p.weight * (p.x - meanX) * (p.y - meanY);
    den += p.weight * (p.x - meanX) * (p.x - meanX);
  }
  if (den === 0) return null;
  const slope = num / den;
  return { slope, intercept: meanY - slope * meanX };
}

/**
 * Turn raw reports into the per-route offset model.
 *
 * Each report: { routeKey, tripTime: "HH:MM", stopIndex, minutesOfDay, ageDays }
 * `minutesOfDay` and `ageDays` are both measured in Israel local time by the
 * API, so the client never has to be trusted about the clock.
 */
export function buildEtaModel(reports) {
  const byRoute = new Map();
  const globalPoints = [];
  let used = 0;

  for (const r of reports || []) {
    const scheduled = toMinutes(r.tripTime);
    const observed = Number(r.minutesOfDay);
    const stopIndex = Number(r.stopIndex);
    if (scheduled === null || !isFinite(observed)) continue;
    if (!isFinite(stopIndex) || stopIndex < 0) continue;

    // A report just after midnight for a late-evening departure wraps around.
    let offset = observed - scheduled;
    if (offset < -720) offset += 1440;
    if (!isPlausibleReport(r.tripTime, observed)) continue;

    const weight = recencyWeight(r.ageDays);
    if (weight <= 0.01) continue;

    const key = String(r.routeKey || "");
    if (!byRoute.has(key)) byRoute.set(key, new Map());
    const stops = byRoute.get(key);
    if (!stops.has(stopIndex)) stops.set(stopIndex, []);
    stops.get(stopIndex).push({ value: offset, weight });
    globalPoints.push({ x: stopIndex, y: offset, weight });
    used += 1;
  }

  const globalFit = fitLine(globalPoints);
  const global = {
    startDelay:
      globalFit && isFinite(globalFit.intercept)
        ? clamp(globalFit.intercept, -5, 30)
        : DEFAULT_START_DELAY,
    pacePerStop:
      globalFit && isFinite(globalFit.slope)
        ? clamp(globalFit.slope, MIN_PACE_PER_STOP, 6)
        : DEFAULT_PACE_PER_STOP,
    samples: used,
  };

  const routes = {};
  for (const [routeKey, stops] of byRoute.entries()) {
    const stopStats = {};
    const points = [];
    let routeSamples = 0;

    for (const [stopIndex, pairs] of stops.entries()) {
      const median = weightedMedian(pairs);
      if (median === null) continue;
      const spread = medianAbsDeviation(pairs, median);
      const weight = pairs.reduce((s, p) => s + p.weight, 0);
      stopStats[stopIndex] = {
        offset: round1(median),
        samples: pairs.length,
        spread: spread === null ? null : round1(spread),
      };
      points.push({ x: stopIndex, y: median, weight });
      routeSamples += pairs.length;
    }

    const fit = fitLine(points);
    routes[routeKey] = {
      stops: stopStats,
      samples: routeSamples,
      startDelay:
        fit && isFinite(fit.intercept)
          ? round1(clamp(fit.intercept, -5, 30))
          : global.startDelay,
      pacePerStop:
        fit && isFinite(fit.slope)
          ? round1(clamp(fit.slope, MIN_PACE_PER_STOP, 6))
          : global.pacePerStop,
    };
  }

  return { routes, global, samples: used };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function round1(value) {
  return Math.round(value * 10) / 10;
}

/**
 * Minutes from the scheduled departure until the bus reaches `stopIndex`,
 * plus how much we trust that number.
 *
 * `observed` — the stop's own reports carried it.
 * `learned`  — the route's fitted line carried it (neighbouring stops did).
 * `default`  — nobody has ever reported this route; it is a guess.
 */
export function stopOffset(model, routeKey, stopIndex) {
  const idx = Number(stopIndex);
  const safeIdx = isFinite(idx) && idx > 0 ? idx : 0;
  const route = model && model.routes ? model.routes[routeKey] : null;
  const global = (model && model.global) || {
    startDelay: DEFAULT_START_DELAY,
    pacePerStop: DEFAULT_PACE_PER_STOP,
    samples: 0,
  };

  if (!route) {
    // Nobody has reported this route. Other routes' pace is a better guess
    // than a hard-coded one, but it is still a guess — say so, so the UI can
    // present it as an estimate rather than as tracking.
    return {
      minutes: round1(global.startDelay + global.pacePerStop * safeIdx),
      confidence: global.samples > 0 ? "low" : "none",
      samples: 0,
      source: "default",
    };
  }

  const line = route.startDelay + route.pacePerStop * safeIdx;
  const stat = route.stops[safeIdx] || route.stops[String(safeIdx)];

  if (stat && stat.samples >= MIN_SAMPLES_PER_STOP) {
    // Blend the stop's own median toward the route line until it has enough
    // reports to stand on its own — one loud outlier shouldn't own a stop.
    const w = stat.samples / (stat.samples + MIN_SAMPLES_PER_STOP);
    return {
      minutes: round1(stat.offset * w + line * (1 - w)),
      confidence: stat.samples >= 5 ? "high" : "medium",
      samples: stat.samples,
      spread: stat.spread,
      source: "observed",
    };
  }

  return {
    minutes: round1(line),
    confidence: route.samples >= 5 ? "medium" : "low",
    samples: stat ? stat.samples : 0,
    source: "learned",
  };
}

/**
 * Arrival estimate for one stop on one trip.
 *
 * With a live report in hand we know where that bus actually was and how late
 * it was running, so every later stop moves by the same delta. Without one we
 * fall back to the learned average for the route.
 */
export function estimateArrival(model, opts) {
  const {
    routeKey,
    tripTime,
    stopIndex,
    liveReport,
    nowMinutes,
  } = opts || {};

  const scheduled = toMinutes(tripTime);
  if (scheduled === null) return null;

  const base = stopOffset(model, routeKey, stopIndex);
  let minutesOfDay = scheduled + base.minutes;
  let delay = 0;
  let live = false;
  let confidence = base.confidence;

  if (liveReport && isFinite(Number(liveReport.minutesOfDay))) {
    const seenIdx = Number(liveReport.stopIndex);
    const seenOffset = stopOffset(model, routeKey, seenIdx);
    const expectedAtSeen = scheduled + seenOffset.minutes;
    delay = Number(liveReport.minutesOfDay) - expectedAtSeen;
    // A live sighting is evidence about this bus, not about the route: cap how
    // far one report can drag the schedule.
    delay = clamp(delay, -20, 60);

    if (Number(stopIndex) > seenIdx) {
      minutesOfDay = scheduled + base.minutes + delay;
      // The bus cannot reach a later stop before it was seen at an earlier one,
      // and it needs at least a minute per stop to get there — without the
      // per-stop term, two stops in a row can collapse onto the same minute.
      const floor =
        Number(liveReport.minutesOfDay) + (Number(stopIndex) - seenIdx);
      if (minutesOfDay < floor) minutesOfDay = floor;
      live = true;
      confidence = base.confidence === "none" ? "low" : base.confidence;
    } else if (Number(stopIndex) === seenIdx) {
      minutesOfDay = Number(liveReport.minutesOfDay);
      live = true;
      confidence = "high";
    }
  }

  const result = {
    minutesOfDay: round1(minutesOfDay),
    time: formatMinutesOfDay(minutesOfDay),
    scheduled,
    offset: base.minutes,
    delay: round1(delay),
    live,
    confidence,
    samples: base.samples,
    source: base.source,
  };

  if (isFinite(Number(nowMinutes))) {
    result.inMinutes = Math.round(minutesOfDay - Number(nowMinutes));
  }
  return result;
}

/**
 * The newest report per (route, trip) — one entry per bus currently out there.
 * `reports` come from the API with `ageMinutes` measured against the server
 * clock, so a device with a wrong time can't resurrect an old sighting.
 */
export function activeTrips(reports, nowMinutes, options) {
  const opts = options || {};
  const window = opts.windowMinutes || TRIP_ACTIVE_MINUTES;
  const latest = new Map();

  for (const r of reports || []) {
    const age = Number(r.ageMinutes);
    if (!isFinite(age) || age < 0 || age > window) continue;
    const stopIndex = Number(r.stopIndex);
    if (!isFinite(stopIndex) || stopIndex < 0) continue;

    const key = (r.routeKey || "") + "|" + (r.tripTime || "");
    const prev = latest.get(key);
    // Newest report wins; on a tie prefer the one further along the route.
    if (
      !prev ||
      age < prev.ageMinutes ||
      (age === prev.ageMinutes && stopIndex > prev.stopIndex)
    ) {
      latest.set(key, {
        routeKey: r.routeKey,
        tripTime: r.tripTime,
        stopName: r.stopName,
        stopIndex,
        ageMinutes: age,
        reports: 0,
        minutesOfDay: isFinite(Number(nowMinutes))
          ? Number(nowMinutes) - age
          : null,
      });
    }
  }

  // Count every report behind each bus — "3 riders reported" reads as more
  // trustworthy than one, and the UI says so.
  for (const r of reports || []) {
    const age = Number(r.ageMinutes);
    if (!isFinite(age) || age < 0 || age > window) continue;
    const key = (r.routeKey || "") + "|" + (r.tripTime || "");
    const entry = latest.get(key);
    if (entry) entry.reports += 1;
  }

  return [...latest.values()].sort((a, b) => a.ageMinutes - b.ageMinutes);
}

/** The bus most worth showing on a given route card. */
export function activeTripForRoute(trips, routeKey) {
  const forRoute = (trips || []).filter((t) => t.routeKey === routeKey);
  if (forRoute.length === 0) return null;
  return forRoute[0];
}
