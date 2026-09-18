import { sql } from "@vercel/postgres";
import {
  buildEtaModel,
  RETENTION_DAYS,
  LIVE_WINDOW_MINUTES,
} from "../src/lib/liveEta.js";

// Crowd-sourced "I'm on the bus at this stop" reports.
//
// GET  → the ETA model learned from the last week plus the sightings that are
//        still fresh enough to place a bus on the map right now.
// POST → one rider report. No login: the whole point is that anyone waiting at
//        a stop can tap twice and help the next person. Writes are therefore
//        narrow (four short fields), rate-limited per device, and pruned to a
//        one-week backlog on every insert.

const MAX_ROUTE_KEY = 120;
const MAX_STOP_NAME = 160;
const MAX_STOP_INDEX = 200;
const MAX_CLIENT_ID = 64;

// Per-device limits. Generous enough for a rider reporting each leg of their
// day, tight enough that one script can't invent a rush hour.
const MIN_SECONDS_BETWEEN_REPORTS = 40;
const MAX_REPORTS_PER_DAY = 40;
// A repeat of the same stop on the same trip is a double-tap, not new data.
const DUPLICATE_WINDOW_MINUTES = 15;

let tableReady = false;

async function ensureReportsTable() {
  if (tableReady) return;
  await sql`
    CREATE TABLE IF NOT EXISTS shuttle_reports (
      id SERIAL PRIMARY KEY,
      route_key TEXT NOT NULL,
      trip_time TEXT,
      stop_name TEXT NOT NULL,
      stop_index INT NOT NULL,
      client_id TEXT,
      reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS shuttle_reports_reported_at_idx
      ON shuttle_reports (reported_at DESC);
  `;
  tableReady = true;
}

// One week back, nothing older. Cheap enough to run on every write.
async function pruneOldReports() {
  await sql`
    DELETE FROM shuttle_reports
    WHERE reported_at < NOW() - (${RETENTION_DAYS} * INTERVAL '1 day')
  `;
}

function cleanString(value, maxLength) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

function cleanTripTime(value) {
  if (typeof value !== "string") return null;
  const m = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (h > 23 || min > 59) return null;
  return String(h).padStart(2, "0") + ":" + m[2];
}

async function handleGet(req, res) {
  // Times of day are derived in Israel local time inside Postgres, so the
  // model never depends on a phone's clock or timezone being right.
  const { rows } = await sql`
    SELECT
      route_key,
      trip_time,
      stop_name,
      stop_index,
      EXTRACT(EPOCH FROM (NOW() - reported_at)) / 60 AS age_minutes,
      EXTRACT(HOUR FROM reported_at AT TIME ZONE 'Asia/Jerusalem') * 60
        + EXTRACT(MINUTE FROM reported_at AT TIME ZONE 'Asia/Jerusalem') AS minutes_of_day
    FROM shuttle_reports
    WHERE reported_at > NOW() - (${RETENTION_DAYS} * INTERVAL '1 day')
      AND trip_time IS NOT NULL
    ORDER BY reported_at DESC
    LIMIT 5000
  `;

  const samples = rows.map((row) => ({
    routeKey: row.route_key,
    tripTime: row.trip_time,
    stopName: row.stop_name,
    stopIndex: Number(row.stop_index),
    minutesOfDay: Number(row.minutes_of_day),
    ageMinutes: Number(row.age_minutes),
    ageDays: Number(row.age_minutes) / 1440,
  }));

  const model = buildEtaModel(samples);

  const live = samples
    .filter((s) => s.ageMinutes <= LIVE_WINDOW_MINUTES)
    .map((s) => ({
      routeKey: s.routeKey,
      tripTime: s.tripTime,
      stopName: s.stopName,
      stopIndex: s.stopIndex,
      ageMinutes: Math.round(s.ageMinutes),
    }));

  const todayCount = samples.filter((s) => s.ageMinutes <= 1440).length;

  // A short shared cache keeps a busy stop from hammering the database while
  // still feeling live — a sighting shows up within a few seconds.
  res.setHeader("Cache-Control", "public, s-maxage=15, stale-while-revalidate=45");
  return res.status(200).json({
    model,
    live,
    totals: { week: samples.length, today: todayCount },
    retentionDays: RETENTION_DAYS,
    liveWindowMinutes: LIVE_WINDOW_MINUTES,
  });
}

async function handlePost(req, res) {
  const body = req.body || {};

  const routeKey = cleanString(body.routeKey, MAX_ROUTE_KEY);
  const stopName = cleanString(body.stopName, MAX_STOP_NAME);
  const tripTime = cleanTripTime(body.tripTime);
  const clientId = cleanString(body.clientId, MAX_CLIENT_ID);
  const stopIndex = Number(body.stopIndex);

  if (!routeKey || !stopName || !tripTime) {
    return res
      .status(400)
      .json({ error: "routeKey, stopName and tripTime are required" });
  }
  if (!Number.isInteger(stopIndex) || stopIndex < 0 || stopIndex > MAX_STOP_INDEX) {
    return res.status(400).json({ error: "stopIndex out of range" });
  }
  if (!clientId) {
    return res.status(400).json({ error: "clientId is required" });
  }

  const { rows: recent } = await sql`
    SELECT
      MAX(reported_at) FILTER (WHERE reported_at > NOW() - INTERVAL '1 hour') AS last_at,
      COUNT(*) FILTER (WHERE reported_at > NOW() - INTERVAL '1 day') AS day_count,
      COUNT(*) FILTER (
        WHERE reported_at > NOW() - (${DUPLICATE_WINDOW_MINUTES} * INTERVAL '1 minute')
          AND route_key = ${routeKey}
          AND trip_time = ${tripTime}
          AND stop_index = ${stopIndex}
      ) AS duplicate_count
    FROM shuttle_reports
    WHERE client_id = ${clientId}
  `;

  const stats = recent[0] || {};
  if (Number(stats.duplicate_count) > 0) {
    // Already counted — tell the client it worked rather than scolding them.
    return res.status(200).json({ success: true, duplicate: true });
  }
  if (stats.last_at) {
    const secondsSince = (Date.now() - new Date(stats.last_at).getTime()) / 1000;
    if (secondsSince < MIN_SECONDS_BETWEEN_REPORTS) {
      return res.status(429).json({
        error: "Too many reports",
        retryAfterSeconds: Math.ceil(MIN_SECONDS_BETWEEN_REPORTS - secondsSince),
      });
    }
  }
  if (Number(stats.day_count) >= MAX_REPORTS_PER_DAY) {
    return res.status(429).json({ error: "Daily report limit reached" });
  }

  await sql`
    INSERT INTO shuttle_reports (route_key, trip_time, stop_name, stop_index, client_id)
    VALUES (${routeKey}, ${tripTime}, ${stopName}, ${stopIndex}, ${clientId})
  `;

  try {
    await pruneOldReports();
  } catch (pruneErr) {
    // Losing a prune costs a few stale rows, never the rider's report.
    console.error("Error pruning reports:", pruneErr);
  }

  return res.status(201).json({ success: true });
}

export default async function handler(req, res) {
  try {
    await ensureReportsTable();

    if (req.method === "GET") return await handleGet(req, res);
    if (req.method === "POST") return await handlePost(req, res);

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Error in reports:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
