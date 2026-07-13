import { sql } from "@vercel/postgres";
import jwt from "jsonwebtoken";
import { parse } from "cookie";
import { recordVersion } from "./history.js";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_dev";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const { rows } = await sql`
        SELECT value FROM app_settings WHERE key = 'app_data'
      `;

      if (rows.length === 0) {
        return res.status(404).json({ error: "Data not found" });
      }

      const data = JSON.parse(rows[0].value);
      res.setHeader(
        "Cache-Control",
        "public, s-maxage=60, stale-while-revalidate=300",
      );
      return res.status(200).json(data);
    } catch (error) {
      console.error("Error fetching data:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  } else if (req.method === "POST") {
    const { data, label } = req.body;

    if (!data) {
      return res.status(400).json({ error: "Data is required" });
    }

    try {
      // Verify JWT token
      const cookies = parse(req.headers.cookie || "");
      const token = cookies.auth_token;

      if (!token) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      try {
        jwt.verify(token, JWT_SECRET);
      } catch (err) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Update data
      const dataString = JSON.stringify(data);
      await sql`
        INSERT INTO app_settings (key, value)
        VALUES ('app_data', ${dataString})
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
      `;

      // Every publish becomes a restorable version, and supersedes the draft.
      try {
        await recordVersion(dataString, label || "פרסום מלוח הבקרה");
        await sql`DELETE FROM app_settings WHERE key = 'app_draft'`;
      } catch (histErr) {
        console.error("Error recording version:", histErr);
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error updating data:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}
