import { sql } from "@vercel/postgres";
import { isAuthed } from "./history.js";

export default async function handler(req, res) {
  if (!isAuthed(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    if (req.method === "GET") {
      const { rows } = await sql`
        SELECT value FROM app_settings WHERE key = 'app_draft'
      `;
      if (rows.length === 0) {
        return res.status(200).json({ draft: null });
      }
      return res.status(200).json({ draft: JSON.parse(rows[0].value) });
    }

    if (req.method === "POST") {
      const { data } = req.body || {};
      if (!data) {
        return res.status(400).json({ error: "Data is required" });
      }
      const wrapped = JSON.stringify({
        saved_at: new Date().toISOString(),
        data: data,
      });
      await sql`
        INSERT INTO app_settings (key, value)
        VALUES ('app_draft', ${wrapped})
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
      `;
      return res.status(200).json({ success: true });
    }

    if (req.method === "DELETE") {
      await sql`DELETE FROM app_settings WHERE key = 'app_draft'`;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Error in draft:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
