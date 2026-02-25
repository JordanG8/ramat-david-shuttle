// ═══════════════════════════════════════════
// RAMAT DAVID SHUTTLE — APP
// ═══════════════════════════════════════════

import "./src/styles/styles.css";
import {
  DATA as fallbackDATA,
  OLD_ROUTES as fallbackOLD_ROUTES,
} from "./src/data/fallbackData.js";

let DATA = JSON.parse(JSON.stringify(fallbackDATA));
let OLD_ROUTES = JSON.parse(JSON.stringify(fallbackOLD_ROUTES));

// Make them globally available for admin.js if needed
window.DATA = DATA;
window.OLD_ROUTES = OLD_ROUTES;

// ─── Load Admin Overrides from localStorage ───
(function applyAdminOverrides() {
  try {
    const saved = localStorage.getItem("shuttle_admin_data");
    if (!saved) return;
    const d = JSON.parse(saved);
    if (d.units) DATA.units = d.units;
    if (d.bus_routes) DATA.bus_routes = d.bus_routes;
    if (d.old_routes) {
      OLD_ROUTES = d.old_routes;
      window.OLD_ROUTES = OLD_ROUTES;
    }
  } catch (e) {
    console.warn("Admin override load failed:", e);
  }
})();

// ─── Helpers ───
function esc(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

const chevronSVG = `<svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>`;
const smallChevronSVG = `<svg class="tl-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>`;
const arrowSVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`;

// ─── Render Stations ───
function renderStationsHtml() {
  return DATA.units
    .map((unit) => {
      const deptCount = unit.departments.length;
      const noteIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
      let noteHtml = unit.notes
        ? `<div class="unit-note">${noteIcon}${esc(unit.notes)}</div>`
        : "";
      if (unit.notes2) {
        noteHtml += `<div class="unit-note">${noteIcon}${esc(unit.notes2)}</div>`;
      }

      const deptsHtml = unit.departments
        .map((dept) => {
          const isService = dept.type === "תחנת שירות";
          const dotClass = isService ? "service" : "alt";
          const goesTo = dept.goes_to
            ? `<span class="dept-goes-to">${arrowSVG} ${esc(dept.goes_to)}</span>`
            : "";
          return `
        <div class="dept-item">
          <div class="dept-info">
            <span class="dept-dot ${dotClass}"></span>
            <span class="dept-name">${esc(dept.name)}</span>
          </div>
          ${goesTo}
        </div>`;
        })
        .join("");

      const colorStyle = unit.color
        ? `style="border-right:4px solid ${esc(unit.color)}"`
        : "";
      const headerColorStyle = unit.color
        ? `style="border-left-color:${esc(unit.color)}"`
        : "";

      return `
      <div class="unit-card" ${colorStyle}>
        <div class="unit-header" onclick="this.parentElement.classList.toggle('open')">
          <div class="unit-title">
            ${unit.color ? `<span class="unit-color-dot" style="background:${esc(unit.color)}"></span>` : ""}
            ${esc(unit.name)}
            <span class="unit-count">${deptCount}</span>
          </div>
          <div class="unit-meta">
            ${chevronSVG}
          </div>
        </div>
        <div class="unit-body">
          ${noteHtml}
          <div class="dept-list">
            ${deptsHtml}
          </div>
        </div>
      </div>`;
    })
    .join("");
}

// ─── Hub-and-Spoke State ───
let currentView = "home"; // "home" | "train" | "tzomet" | "internal" | "hada" | "oncall" | "info"
let highlightTime = null;

// ─── Icons ───
const clockSVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
const mapPinSVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
const moonSVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
const infoSVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;

function renderStopsCard(stops) {
  const stopsHtml = stops
    .map(
      (stop, i) =>
        `<div class="stop-item"><span class="stop-num">${i + 1}</span>${esc(stop)}</div>`,
    )
    .join("");
  return `
    <div class="card-block stops-block-static">
      <div class="card-block-header static">
        <div class="card-block-title">${mapPinSVG} תחנות עצירה</div>
      </div>
      <div class="stops-list">
        ${stopsHtml}
      </div>
    </div>`;
}

const reinforceSVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg>`;

function isTimePassed(timeStr) {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return false;
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  return parseInt(match[1]) * 60 + parseInt(match[2]) < nowMins;
}

function renderDepartureList(items, extraClass) {
  return `<div class="departure-list">
    ${items
      .map((d) => {
        const passed = isTimePassed(d.time) ? " dep-time-passed" : "";
        return `<span class="dep-time-item ${extraClass || ""} ${d.note ? "dep-time-item--reinforce" : ""}${passed}">${esc(d.time)}</span>`;
      })
      .join("")}
  </div>`;
}

function renderDepartureTable(departures, filterReinforcement, split) {
  if (split) {
    const regular = departures.filter((d) => !d.note);
    const reinforce = departures.filter((d) => !!d.note);
    let html = "";
    if (regular.length > 0) {
      html += `
        <div class="card-block times-block-compact">
          <div class="card-block-header static">
            <div class="card-block-title">${clockSVG} שעות יציאה <span class="estimated-tag">משוערות</span></div>
          </div>
          ${renderDepartureList(regular)}
        </div>`;
    }
    if (reinforce.length > 0) {
      const reinforceOpen = isReinforcementDay() ? " open" : "";
      html += `
        <div class="card-block times-block-compact times-block--reinforce${reinforceOpen}" onclick="this.classList.toggle('open')">
          <div class="card-block-header reinforce-header">
            <div class="card-block-title">${reinforceSVG} תגבור ראשון וחמישי <span class="estimated-tag">משוער</span></div>
            <div class="card-block-meta">${smallChevronSVG}</div>
          </div>
          <div class="card-block-body">
            ${renderDepartureList(reinforce, "dep-time-item--reinforce")}
          </div>
        </div>`;
    }
    return html;
  }

  const filtered = departures.filter((d) => {
    const isReinforcement = !!d.note;
    if (filterReinforcement === "only") return isReinforcement;
    if (filterReinforcement === "none") return !isReinforcement;
    return true;
  });
  if (filtered.length === 0) return '<div class="no-data">אין שעות יציאה</div>';

  return `
    <div class="card-block times-block-compact">
      <div class="card-block-header static">
        <div class="card-block-title">${clockSVG} שעות יציאה <span class="estimated-tag">משוערות</span></div>
      </div>
      ${renderDepartureList(filtered)}
    </div>`;
}

function renderDepartureTimesStr(timesStr) {
  const times = timesStr.split("-");
  return `
    <div class="card-block times-block-compact">
      <div class="card-block-header static">
        <div class="card-block-title">${clockSVG} שעות יציאה <span class="estimated-tag">משוערות</span></div>
      </div>
      <div class="departure-list">
        ${times
          .map((t) => {
            const passed = isTimePassed(t.trim()) ? " dep-time-passed" : "";
            return `<span class="dep-time-item${passed}">${esc(t)}</span>`;
          })
          .join("")}
      </div>
    </div>`;
}

function renderRouteCard(route, opts) {
  opts = opts || {};
  const filterReinforcement = opts.filterReinforcement || "all";
  const titleOverride = opts.title;
  const hideStops = opts.hideStops;

  let bodyHtml = "";

  if (route.departure_times) {
    bodyHtml += renderDepartureTable(
      route.departure_times,
      filterReinforcement,
      opts.splitReinforcement,
    );
  }

  if (route.departure_times_str) {
    bodyHtml += renderDepartureTimesStr(route.departure_times_str);
  }

  if (route.stops && !hideStops) {
    bodyHtml += renderStopsCard(route.stops);
  }

  if (route.note) {
    bodyHtml += `<div class="route-note">${infoSVG} ${esc(route.note)}</div>`;
  }

  if (route.evening && !opts.hideEvening) {
    bodyHtml += `
      <div class="card-block evening-block">
        <div class="card-block-header static">
          <div class="card-block-title">${moonSVG} ערב <span class="estimated-tag">משוער</span></div>
        </div>
        <div class="evening-info">
          <div class="dep-chip dep-chip--evening">
            <span class="dep-chip-time">${esc(route.evening.time)}</span>
          </div>
          <div class="evening-note">${esc(route.evening.break)}</div>
        </div>
      </div>`;
  }

  const name = titleOverride || route.name;
  const titleHtml = formatRouteTitle(name);

  const countdownHtml = renderCountdownBanner(route);

  return `
    <div class="route-card">
      <div class="route-card-header">
        <div class="route-card-title">${titleHtml}</div>
      </div>
      ${countdownHtml}
      <div class="route-card-body">
        ${bodyHtml}
      </div>
    </div>`;
}

function isReinforcementDay() {
  const day = new Date().getDay(); // 0=Sun, 4=Thu
  return day === 0 || day === 4;
}

function isReinforcementTime(d) {
  return d.note && d.note.includes("ראשון");
}

function getAllDepartureTimes(route) {
  const times = [];
  const reinforceDay = isReinforcementDay();
  if (route.departure_times) {
    route.departure_times.forEach((d) => {
      // Skip reinforcement-only times if today isn't Sunday/Thursday
      if (!reinforceDay && isReinforcementTime(d)) return;
      times.push(d.time);
    });
  }
  if (route.departure_times_str) {
    route.departure_times_str.split("-").forEach((t) => times.push(t.trim()));
  }
  if (route.sub_routes) {
    route.sub_routes.forEach((sub) => {
      if (sub.departure_times_str) {
        sub.departure_times_str.split("-").forEach((t) => times.push(t.trim()));
      }
      if (sub.departure_times) {
        sub.departure_times.forEach((d) => {
          if (!reinforceDay && isReinforcementTime(d)) return;
          times.push(d.time);
        });
      }
    });
  }
  return times;
}

function getUpcomingDepartures(route) {
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const times = getAllDepartureTimes(route);
  return getUpcomingFromTimes(times, nowMins);
}

function getUpcomingFromTimes(times, nowMins) {
  if (nowMins === undefined) {
    const now = new Date();
    nowMins = now.getHours() * 60 + now.getMinutes();
  }
  const parsed = [];
  times.forEach((t) => {
    const match = t.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return;
    const mins = parseInt(match[1]) * 60 + parseInt(match[2]);
    parsed.push({ time: t, mins });
  });
  parsed.sort((a, b) => a.mins - b.mins);
  const upcoming = [];
  for (const p of parsed) {
    const diff = p.mins - nowMins;
    if (diff >= 0 && diff <= 120) {
      upcoming.push({ time: p.time, minutes: diff });
    }
  }
  return upcoming;
}

function renderCountdownBanner(route) {
  const upcoming = getUpcomingDepartures(route);
  return renderCountdownFromUpcoming(upcoming);
}

function renderCountdownFromNext(next) {
  // Backwards compat wrapper
  if (!next) return "";
  return renderCountdownFromUpcoming([next]);
}

function formatMinutes(mins) {
  if (mins === 0) return "עכשיו!";
  if (mins <= 60) return mins + " דק׳";
  const extraMins = mins - 60;
  if (extraMins === 0) return "שעה";
  return "שעה ו" + extraMins + " דק׳";
}

function renderCountdownFromUpcoming(upcoming) {
  if (!upcoming || upcoming.length === 0) return "";

  const items = upcoming
    .map((dep) => {
      const urgent = dep.minutes <= 5;
      return `<div class="cb-item ${urgent ? "cb-item-urgent" : ""}">
      <div class="cb-item-row">
        <span class="live-dot ${urgent ? "urgent" : ""}"></span>
        <span class="cb-minutes">${formatMinutes(dep.minutes)}</span>
      </div>
      <span class="cb-time">${esc(dep.time)}</span>
    </div>`;
    })
    .join("");

  const anyUrgent = upcoming.some((d) => d.minutes <= 5);
  return `<div class="countdown-banner ${anyUrgent ? "countdown-urgent" : ""}">
    <div class="cb-label-col">
      <span class="cb-label">הקווים הקרובים</span>
      <span class="cb-disclaimer">*זמני היציאה משוערים*</span>
    </div>
    <div class="cb-items">${items}</div>
  </div>`;
}

function formatRouteTitle(name) {
  const arrowLeft = `<svg class="route-arrow" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>`;
  if (name.includes(" - ")) {
    const parts = name.split(" - ");
    return `<span class="route-from">${esc(parts[0])}</span>${arrowLeft}<span class="route-to">${esc(parts[1])}</span>`;
  }
  return esc(name);
}

// ─── Home Page Icons ───
const homeSVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
const backArrowSVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>`;

// ─── Get All Upcoming Departures (across all routes) ───
function getAllUpcomingDepartures() {
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const reinforceDay = isReinforcementDay();
  const entries = [];

  // Helper: parse "HH:MM" to minutes
  function parseTime(t) {
    const m = t.match(/^(\d{1,2}):(\d{2})$/);
    return m ? parseInt(m[1]) * 60 + parseInt(m[2]) : -1;
  }

  // Train: bus_routes[0] = to train, bus_routes[1] = from train
  const toTrain = DATA.bus_routes[0];
  const fromTrain = DATA.bus_routes[1];

  function addRouteEntries(route, view, routeLabel, badgeClass) {
    if (route.departure_times) {
      route.departure_times.forEach((d) => {
        if (!reinforceDay && isReinforcementTime(d)) return;
        const mins = parseTime(d.time);
        if (mins < 0) return;
        const diff = mins - nowMins;
        if (diff >= 0 && diff <= 120) {
          entries.push({
            time: d.time,
            mins,
            diff,
            view,
            routeLabel,
            badgeClass,
          });
        }
      });
    }
    if (route.departure_times_str) {
      route.departure_times_str.split("-").forEach((t) => {
        t = t.trim();
        const mins = parseTime(t);
        if (mins < 0) return;
        const diff = mins - nowMins;
        if (diff >= 0 && diff <= 120) {
          entries.push({ time: t, mins, diff, view, routeLabel, badgeClass });
        }
      });
    }
  }

  addRouteEntries(toTrain, "train", "בסיס ← רכבת", "board-badge-train");
  addRouteEntries(fromTrain, "train", "רכבת ← בסיס", "board-badge-train");

  // Tzomet: bus_routes[3]
  const tzomet = DATA.bus_routes[3];
  addRouteEntries(tzomet, "tzomet", "צומת ← בסיס", "board-badge-tzomet");

  // Internal: bus_routes[2] has sub_routes
  const internal = DATA.bus_routes[2];
  if (internal.sub_routes) {
    internal.sub_routes.forEach((sub) => {
      const label = sub.name.includes("105") ? "פנים כנף 105" : "פנים כנף 109";
      addRouteEntries(sub, "internal", label, "board-badge-internal");
    });
  }

  // Hada trips from OLD_ROUTES
  const hadaGroups = getHadaTrips();
  for (const key of Object.keys(hadaGroups)) {
    hadaGroups[key].forEach((trip) => {
      const mins = parseTime(trip.time);
      if (mins < 0) return;
      const diff = mins - nowMins;
      if (diff >= 0 && diff <= 120) {
        entries.push({
          time: trip.time,
          mins,
          diff,
          view: "hada",
          routeLabel: 'חד"א',
          badgeClass: "board-badge-hada",
        });
      }
    });
  }

  // Deduplicate by time+view (same time same route)
  const seen = new Set();
  const unique = [];
  for (const e of entries) {
    const key = e.time + "|" + e.routeLabel;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(e);
    }
  }

  unique.sort((a, b) => a.mins - b.mins);
  return unique;
}

// ─── Check if evening on-call is active ───
function isEveningOnCallActive() {
  const now = new Date();
  const h = now.getHours();
  return h >= 18 && h < 22;
}

// ─── Route meta helper ───
function getRouteMeta(view) {
  const meta = {
    train:    { icon: "train",          label: "רכבת" },
    tzomet:   { icon: "alt_route",      label: "צומת" },
    internal: { icon: "directions_bus",  label: "פנים" },
    hada:     { icon: "restaurant",     label: 'חד"א' },
    oncall:   { icon: "call",           label: "קריאה" },
  };
  return meta[view] || meta.train;
}

// ─── Render Departure Board ───
function renderDepartureBoard() {
  const departures = getAllUpcomingDepartures().slice(0, 6);

  let html = `<div class="board-section">`;

  // ── Board title bar ──
  html += `<div class="board-title-bar">
    <div class="board-title-right">
      <span class="material-symbols-rounded board-title-icon">airport_shuttle</span>
      <span class="board-title-text">לוח יציאות שאטלים</span>
    </div>
    <span class="estimated-tag board-estimated">זמן משוער</span>
  </div>`;

  if (departures.length === 0) {
    html += `<div class="board-empty">
      <span class="material-symbols-rounded board-empty-icon">schedule</span>
      <span class="board-empty-title">אין שאטלים קרובים כרגע</span>
      <span class="board-empty-sub">היציאות הבאות יופיעו כאן כשיהיו שאטלים בשעתיים הקרובות</span>
    </div>`;
  } else {
    // ── Hero: next departure — big & prominent ──
    const hero = departures[0];
    const heroMeta = getRouteMeta(hero.view);
    const heroUrgent = hero.diff <= 5;
    const heroNow = hero.diff === 0;

    html += `<div class="board-hero${heroUrgent ? ' board-hero--urgent' : ''}" onclick="navigateTo('${hero.view}', { highlightTime: '${hero.time}' })">
      <div class="board-hero-label">השאטל הבא</div>
      <div class="board-hero-main">
        <div class="board-hero-countdown">
          ${heroNow
            ? '<span class="board-hero-now">עכשיו!</span>'
            : `<span class="board-hero-num">${hero.diff}</span><span class="board-hero-unit">דק׳</span>`
          }
          ${heroUrgent ? '<span class="live-dot urgent board-hero-dot"></span>' : ''}
        </div>
        <div class="board-hero-detail">
          <div class="board-hero-route">
            <span class="material-symbols-rounded board-hero-route-icon">${heroMeta.icon}</span>
            ${esc(hero.routeLabel)}
          </div>
          <div class="board-hero-time">יציאה ב-${esc(hero.time)}</div>
        </div>
      </div>
      <div class="board-hero-tap">לחץ לפרטי הקו <span class="material-symbols-rounded">arrow_back</span></div>
    </div>`;

    // ── Table: remaining departures ──
    if (departures.length > 1) {
      html += `<div class="board-table">`;
      // Column headers
      html += `<div class="board-table-head">
        <span class="board-th board-th-route">קו</span>
        <span class="board-th board-th-dest">יעד</span>
        <span class="board-th board-th-time">שעה</span>
        <span class="board-th board-th-eta">עוד</span>
      </div>`;
      departures.slice(1).forEach((dep) => {
        const meta = getRouteMeta(dep.view);
        const isUrgent = dep.diff <= 5;
        const isNow = dep.diff === 0;
        html += `<div class="board-tr${isUrgent ? ' board-tr--urgent' : ''}" onclick="navigateTo('${dep.view}', { highlightTime: '${dep.time}' })">
          <span class="board-td board-td-route">
            <span class="material-symbols-rounded board-td-icon">${meta.icon}</span>
          </span>
          <span class="board-td board-td-dest">${esc(dep.routeLabel)}</span>
          <span class="board-td board-td-time">${esc(dep.time)}</span>
          <span class="board-td board-td-eta${isUrgent ? ' board-td-eta--urgent' : ''}">
            ${isNow ? 'עכשיו!' : dep.diff + ' דק׳'}
            ${isUrgent ? '<span class="live-dot urgent board-td-dot"></span>' : ''}
          </span>
        </div>`;
      });
      html += `</div>`;
    }
  }

  html += `</div>`;
  return html;
}

// ─── Render Nav Buttons ───
function renderNavButtons() {
  const buttons = [
    {
      icon: '<span class="material-symbols-rounded">train</span>',
      label: "בסיס - רכבת כפר יהושע",
      sub: "נסיעות לרכבת הגלילים",
      view: "train",
      iconClass: "nav-btn-icon-wrap--train",
    },
    {
      icon: '<span class="material-symbols-rounded">alt_route</span>',
      label: "צומת רמת דוד - בסיס",
      sub: "שאטל מהצומת לבסיס",
      view: "tzomet",
      iconClass: "nav-btn-icon-wrap--tzomet",
    },
    {
      icon: '<span class="material-symbols-rounded">directions_bus</span>',
      label: "פיזור למקומות עבודה",
      sub: "הסעות פנים בסיס",
      view: "internal",
      iconClass: "nav-btn-icon-wrap--internal",
    },
    {
      icon: '<span class="material-symbols-rounded">restaurant</span>',
      label: 'חד"א',
      sub: "נסיעות לחדר האוכל",
      view: "hada",
      iconClass: "nav-btn-icon-wrap--hada",
    },
    {
      icon: '<span class="material-symbols-rounded">call</span>',
      label: "שאטל לפי קריאה",
      sub: "הזמנת נסיעה",
      view: "oncall",
      iconClass: "nav-btn-icon-wrap--oncall",
    },
    {
      icon: '<span class="material-symbols-rounded">map</span>',
      label: "מקרא תחנות ומידע",
      sub: "מפה ומידע כללי",
      view: "info",
      iconClass: "nav-btn-icon-wrap--info",
    },
  ];

  let html = `<div class="nav-card">`;
  html += `<div class="nav-card-brand">
    <div class="nav-card-brand-text">
      <div class="nav-card-brand-title">אפליקציית השאטלים</div>
      <div class="nav-card-brand-sub">בסיס כנף 1 — רמת דוד</div>
    </div>
  </div>`;
  html += `<div class="nav-card-cta">
    <span class="material-symbols-rounded nav-card-title-icon">explore</span>
    <h2 class="nav-card-title">לאן את.ה צריך להגיע?</h2>
  </div>`;
  html += `<div class="nav-buttons">`;
  buttons.forEach((btn) => {
    html += `<div class="nav-btn" onclick="navigateTo('${btn.view}')">
      <div class="nav-btn-icon-wrap ${btn.iconClass}">
        <span class="nav-btn-icon">${btn.icon}</span>
      </div>
      <div class="nav-btn-text">
        <span class="nav-btn-label">${esc(btn.label)}</span>
        <span class="nav-btn-sub">${esc(btn.sub)}</span>
      </div>
    </div>`;
  });
  html += `</div></div>`;
  return html;
}

// ─── Render Home Page ───
function renderHomePage() {
  let html = "";
  html += renderDepartureBoard();
  html += renderNavButtons();
  return html;
}

// ─── Render Top Tabs ───
function renderTopTabs() {
  const tabs = [
    { icon: "home", label: "בית", view: "home" },
    { icon: "train", label: "רכבת", view: "train" },
    { icon: "alt_route", label: "צומת", view: "tzomet" },
    { icon: "directions_bus", label: "פנים כנף", view: "internal" },
    { icon: "restaurant", label: 'חד"א', view: "hada" },
    { icon: "call", label: "לפי קריאה", view: "oncall" },
    { icon: "info", label: "מידע", view: "info" },
  ];

  let html = `<div class="top-tabs">`;
  tabs.forEach((tab) => {
    const active = tab.view === currentView ? " top-tab-active" : "";
    html += `<button class="top-tab${active}" onclick="navigateTo('${tab.view}')">
      <span class="material-symbols-rounded top-tab-icon">${tab.icon}</span>
      <span class="top-tab-label">${tab.label}</span>
    </button>`;
  });
  html += `</div>`;
  return html;
}

// ─── Render Route Content (for spoke pages) ───
function renderRouteContent(view) {
  let html = "";

  if (view === "train") {
    const toTrain = DATA.bus_routes[0];
    const fromTrain = DATA.bus_routes[1];
    html += renderRouteCard(toTrain, { splitReinforcement: true });
    html += renderRouteCard(fromTrain, { splitReinforcement: true });
  } else if (view === "tzomet") {
    const tzomet = DATA.bus_routes[3];
    html += renderRouteCard(tzomet, { hideEvening: true });
  } else if (view === "internal") {
    const internal = DATA.bus_routes[2];
    if (internal.note) {
      html += `<div class="route-note top-note">${infoSVG} ${esc(internal.note)}</div>`;
    }
    if (internal.sub_routes) {
      internal.sub_routes.forEach((sub) => {
        html += renderRouteCard(sub);
      });
    }
  } else if (view === "hada") {
    html += renderHadaContent();
  } else if (view === "oncall") {
    html += renderOnCallContent();
  } else if (view === "info") {
    html += renderInfoContent();
  }

  return html;
}

// ─── Navigate To ───
function navigateTo(view, opts) {
  opts = opts || {};
  currentView = view;
  highlightTime = opts.highlightTime || null;
  renderCurrentView();
}
window.navigateTo = navigateTo;

// ─── Render Current View (master renderer) ───
function renderCurrentView() {
  const container = document.getElementById("app-content");
  const nav = document.getElementById("main-nav");

  nav.innerHTML = renderTopTabs();

  if (currentView === "home") {
    container.parentElement.classList.add("content-home");
    container.innerHTML = renderHomePage();
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else {
    container.parentElement.classList.remove("content-home");
    container.innerHTML = renderRouteContent(currentView);

    if (currentView === "info") attachOldRouteTabListeners();

    // Highlight specific time if navigating from board
    if (highlightTime) {
      requestAnimationFrame(() => {
        const timeToFind = highlightTime;
        highlightTime = null;
        // Find dep-time-item or dep-chip-time matching the time
        const allTimeEls = container.querySelectorAll(
          ".dep-time-item, .dep-chip-time, .card-block-title, .sched-time",
        );
        for (const el of allTimeEls) {
          if (el.textContent.trim() === timeToFind) {
            el.classList.add("dep-time-highlight");
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            setTimeout(() => el.classList.remove("dep-time-highlight"), 3000);
            break;
          }
        }
      });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }
}

// ─── חד"א (Cafeteria) Direction Data ───
function classifyHadaArea(stops) {
  const s = stops.join(" ");
  if (s.includes("גף מנועים")) return "maintenance";
  if (s.includes("גף טיסה 109") || s.includes("גף טכני 109")) return "109";
  return "105";
}

function getHadaTrips() {
  const groups = { 105: [], 109: [], maintenance: [] };
  OLD_ROUTES.forEach((route) => {
    route.schedule.forEach((entry) => {
      if (entry.type !== "נסיעה" || !entry.stops) return;
      const first = entry.stops[0];
      const last = entry.stops[entry.stops.length - 1];
      if (!isHadaStop(first) && !isHadaStop(last)) return;
      const area = classifyHadaArea(entry.stops);
      groups[area].push({ time: entry.time, stops: entry.stops });
    });
  });
  const parseTime = (t) => {
    const m = t.match(/^(\d{1,2}):(\d{2})$/);
    return m ? parseInt(m[1]) * 60 + parseInt(m[2]) : 9999;
  };
  for (const key of Object.keys(groups)) {
    groups[key].sort((a, b) => parseTime(a.time) - parseTime(b.time));
  }
  return groups;
}

function renderHadaCard(title, trips) {
  if (trips.length === 0) return "";

  const upcoming = getUpcomingFromTimes(trips.map((t) => t.time));
  const countdown = renderCountdownFromUpcoming(upcoming);

  let html = `<div class="route-card">
    <div class="route-card-header">
      <div class="route-card-title">${title}</div>
    </div>
    ${countdown}
    <div class="route-card-body">`;

  trips.forEach((trip) => {
    const passed = isTimePassed(trip.time) ? " trip-passed" : "";
    const stopsHtml = trip.stops
      .map((stop, i) => {
        const hada = isHadaStop(stop) ? " stop-hada" : "";
        return `<div class="stop-item${hada}"><span class="stop-num">${i + 1}</span>${esc(stop)}</div>`;
      })
      .join("");
    html += `
      <div class="card-block stops-block${passed}" onclick="this.classList.toggle('open')">
        <div class="card-block-header">
          <div class="card-block-title">${mapPinSVG} ${esc(trip.time)} <span class="estimated-tag">משוער</span></div>
          <div class="card-block-meta">
            <span class="stop-count-badge">${trip.stops.length} תחנות</span>
            ${smallChevronSVG}
          </div>
        </div>
        <div class="card-block-body">
          <div class="stops-list">${stopsHtml}</div>
        </div>
      </div>`;
  });

  html += `</div></div>`;
  return html;
}

function renderHadaContent() {
  const groups = getHadaTrips();
  let html = "";

  html += renderHadaCard('חד"א - כיוון 105', groups["105"]);
  html += renderHadaCard('חד"א - כיוון 109', groups["109"]);
  html += renderHadaCard('חד"א - טייסת תחזוקה', groups.maintenance);

  return html;
}

// ─── On-Call Shuttle ───
function renderOnCallContent() {
  let html = "";
  const tzomet = DATA.bus_routes[3];

  // Evening hours from tzomet route
  if (tzomet.evening) {
    html += `<div class="route-card">
      <div class="route-card-header">
        <div class="route-card-title">שאטל לפי קריאה - ערב</div>
      </div>
      <div class="route-card-body">
        <div class="card-block evening-block">
          <div class="card-block-header static">
            <div class="card-block-title">${moonSVG} שעות פעילות <span class="estimated-tag">משוערות</span></div>
          </div>
          <div class="evening-info">
            <div class="dep-chip dep-chip--evening">
              <span class="dep-chip-time">${esc(tzomet.evening.time)}</span>
            </div>
            <div class="evening-note">${esc(tzomet.evening.break)}</div>
          </div>
        </div>
        <div class="route-note">${infoSVG}   הזמנת שאטל - מבצעים/הטסה בתיאום מול מוצב מנהלה</div>
      </div>
    </div>`;
  }

  return html;
}

// ─── Old Routes ───
let activeOldRoute = "kav1";

function renderOldRouteTabsHtml() {
  const tabs = OLD_ROUTES.map((r, i) => {
    const id = `kav${i + 1}`;
    const label = r.name.split(" - ")[0];
    return `<button class="route-tab ${id === activeOldRoute ? "active" : ""}" data-oldroute="${id}">${esc(label)}</button>`;
  }).join("");
  return `<div class="route-tabs" id="oldroute-tabs">${tabs}</div>`;
}

function isHadaStop(name) {
  return name.includes('חד"א') || name.includes('חד"א');
}

function renderScheduleEntry(entry) {
  const timeHtml = `<span class="sched-time">${esc(entry.time)}</span>`;

  if (entry.type === "הפסקה") {
    return `<div class="sched-entry sched-break">
      ${timeHtml}
      <span class="sched-type-badge sched-badge-break">הפסקה</span>
    </div>`;
  }

  if (entry.type === "סוף יום") {
    return `<div class="sched-entry sched-end">
      ${timeHtml}
      <span class="sched-type-badge sched-badge-end">סוף יום</span>
    </div>`;
  }

  if (entry.type === "איסוף") {
    return `<div class="sched-entry sched-pickup">
      ${timeHtml}
      <span class="sched-type-badge sched-badge-pickup">איסוף</span>
      ${entry.description ? `<span class="sched-desc">${esc(entry.description)}</span>` : ""}
    </div>`;
  }

  if (entry.type === "נסיעה" && entry.stops) {
    const stopsHtml = entry.stops
      .map((stop, i) => {
        const hada = isHadaStop(stop) ? " stop-hada" : "";
        return `<div class="stop-item${hada}"><span class="stop-num">${i + 1}</span>${esc(stop)}</div>`;
      })
      .join("");

    return `<div class="sched-entry sched-trip">
      <div class="sched-trip-header" onclick="this.parentElement.classList.toggle('open')">
        ${timeHtml}
        <span class="sched-type-badge sched-badge-trip">נסיעה</span>
        <span class="sched-stop-count">${entry.stops.length} תחנות</span>
        ${smallChevronSVG}
      </div>
      <div class="sched-trip-stops">
        <div class="stops-list">${stopsHtml}</div>
      </div>
    </div>`;
  }

  return "";
}

function renderOldRouteContentHtml() {
  const idx = parseInt(activeOldRoute.replace("kav", "")) - 1;
  const route = OLD_ROUTES[idx];
  if (!route) return "";

  const scheduleHtml = route.schedule
    .map((entry) => renderScheduleEntry(entry))
    .join("");

  return `
    <div class="route-card">
      <div class="route-card-header">
        <div class="route-card-title">${esc(route.name)}</div>
      </div>
      <div class="route-card-body">
        <div class="schedule-timeline-note"><span class="estimated-tag">* זמנים משוערים</span></div>
        <div class="schedule-timeline">
          ${scheduleHtml}
        </div>
      </div>
    </div>`;
}

// ─── Info Tab (stations legend + old routes) ───
function renderInfoContent() {
  let html = "";

  // Stations legend
  html += `<div class="info-section">
    <h2 class="info-section-title">מקרא תחנות הכנף</h2>
    <div class="legend">
      <span class="legend-item">
        <span class="badge badge-service"></span>
        תחנת שירות - תחנה ששאטל עוצר בה
      </span>
      <span class="legend-item">
        <span class="badge badge-alt"></span>
        תחנה חלופית - תחנה שממנה נדרש להגיע לתחנת שירות
      </span>
    </div>
    <div class="stations-grid">${renderStationsHtml()}</div>
  </div>`;

  // Old routes
  html += `<div class="info-section">
    <h2 class="info-section-title">קויי שאטל</h2>
    ${renderOldRouteTabsHtml()}
    <div id="oldroute-content" class="route-content">${renderOldRouteContentHtml()}</div>
  </div>`;

  return html;
}

function attachOldRouteTabListeners() {
  const container = document.getElementById("oldroute-tabs");
  if (!container) return;
  container.addEventListener("click", (e) => {
    const btn = e.target.closest(".route-tab");
    if (!btn) return;
    activeOldRoute = btn.dataset.oldroute;
    container
      .querySelectorAll(".route-tab")
      .forEach((t) => t.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("oldroute-content").innerHTML =
      renderOldRouteContentHtml();
  });
}

// ─── Countdown Timer ───
let countdownTimer = null;

function refreshContent() {
  if (currentView === "info") return;
  renderCurrentView();
}

function startCountdownTimer() {
  stopCountdownTimer();
  const now = new Date();
  const msToNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
  countdownTimer = setTimeout(function tick() {
    refreshContent();
    countdownTimer = setInterval(refreshContent, 60000);
  }, msToNextMinute);
}

function stopCountdownTimer() {
  if (countdownTimer) {
    clearTimeout(countdownTimer);
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    renderCurrentView();
    startCountdownTimer();
  } else {
    stopCountdownTimer();
  }
});

window.addEventListener("focus", () => {
  renderCurrentView();
});

// ─── Init ───
document.addEventListener("DOMContentLoaded", async () => {
  const appContent = document.getElementById("app-content");
  if (!appContent) return; // Not the public page

  appContent.innerHTML = '<div style="text-align:center; padding: 2rem;">טוען נתונים...</div>';

  try {
    const res = await fetch("/api/data");
    if (res.ok) {
      const dbData = await res.json();
      if (dbData.units && dbData.units.length > 0) {
        DATA.units = dbData.units;
      }
      if (dbData.bus_routes && dbData.bus_routes.length > 0) {
        DATA.bus_routes = dbData.bus_routes;
      }
      if (dbData.old_routes && dbData.old_routes.length > 0) {
        OLD_ROUTES = dbData.old_routes;
        window.OLD_ROUTES = OLD_ROUTES;
      }
    } else {
      throw new Error("API returned " + res.status);
    }
  } catch (e) {
    console.error("Failed to load data from API, using fallback", e);
    const toast = document.createElement("div");
    toast.style.cssText = "position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:#f44336; color:white; padding:10px 20px; border-radius:4px; z-index:9999; font-family:Rubik,sans-serif;";
    toast.textContent = "שגיאה בטעינת נתונים עדכניים. מוצגים נתוני גיבוי.";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
  }
  renderCurrentView();
  startCountdownTimer();
});
