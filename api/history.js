import { sql } from "@vercel/postgres";
import jwt from "jsonwebtoken";
import { parse } from "cookie";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_dev";
const MAX_VERSIONS = 30;

export function isAuthed(req) {
  try {
    const cookies = parse(req.headers.cookie || "");
    const token = cookies.auth_token;
    if (!token) return false;
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch (err) {
    return false;
  }
}

export async function ensureVersionsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS app_data_versions (
      id SERIAL PRIMARY KEY,
      data TEXT NOT NULL,
      label TEXT,
      summary TEXT,
      saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
}

// Insert a snapshot of the published data and trim history to MAX_VERSIONS.
export async function recordVersion(dataString, label) {
  await ensureVersionsTable();
  let summary = "";
  try {
    const d = JSON.parse(dataString);
    summary = JSON.stringify({
      units: Array.isArray(d.units) ? d.units.length : 0,
      routes: Array.isArray(d.bus_routes) ? d.bus_routes.length : 0,
      schedules: Array.isArray(d.old_routes) ? d.old_routes.length : 0,
    });
  } catch (err) {
    /* summary stays empty */
  }
  await sql`
    INSERT INTO app_data_versions (data, label, summary)
    VALUES (${dataString}, ${label || null}, ${summary})
  `;
  await sql`
    DELETE FROM app_data_versions
    WHERE id NOT IN (
      SELECT id FROM app_data_versions ORDER BY id DESC LIMIT ${MAX_VERSIONS}
    )
  `;
}

export default async function handler(req, res) {
  if (!isAuthed(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    await ensureVersionsTable();

    if (req.method === "GET") {
      const { id } = req.query || {};
      if (id) {
        const { rows } = await sql`
          SELECT id, data, label, summary, saved_at
          FROM app_data_versions WHERE id = ${Number(id)}
        `;
        if (rows.length === 0) {
          return res.status(404).json({ error: "Version not found" });
        }
        const row = rows[0];
        return res.status(200).json({
          id: row.id,
          label: row.label,
          summary: row.summary,
          saved_at: row.saved_at,
          data: JSON.parse(row.data),
        });
      }

      const { rows } = await sql`
        SELECT id, label, summary, saved_at
        FROM app_data_versions ORDER BY id DESC LIMIT ${MAX_VERSIONS}
      `;
      return res.status(200).json({ versions: rows });
    }

    if (req.method === "POST") {
      const { action, id } = req.body || {};
      if (action !== "restore" || !id) {
        return res.status(400).json({ error: "Invalid action" });
      }

      const { rows } = await sql`
        SELECT id, data, saved_at FROM app_data_versions WHERE id = ${Number(id)}
      `;
      if (rows.length === 0) {
        return res.status(404).json({ error: "Version not found" });
      }

      const version = rows[0];
      await sql`
        INSERT INTO app_settings (key, value)
        VALUES ('app_data', ${version.data})
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
      `;
      const restoredAt = new Date(version.saved_at).toLocaleString("he-IL", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "Asia/Jerusalem",
      });
      await recordVersion(version.data, "שחזור גרסה מ־" + restoredAt);
      // A restore replaces whatever draft was in progress.
      await sql`DELETE FROM app_settings WHERE key = 'app_draft'`;

      return res.status(200).json({ success: true, data: JSON.parse(version.data) });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Error in history:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
