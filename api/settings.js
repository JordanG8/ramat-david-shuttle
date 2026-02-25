import { sql } from "@vercel/postgres";
import jwt from "jsonwebtoken";
import { parse } from "cookie";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_dev";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { action, newPassword } = req.body;

  if (!action) {
    return res.status(400).json({ error: "Action is required" });
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

    if (action === "change_password") {
      if (!newPassword) {
        return res.status(400).json({ error: "New password is required" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await sql`
        INSERT INTO app_settings (key, value)
        VALUES ('admin_password', ${hashedPassword})
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
      `;

      return res.status(200).json({ success: true });
    } else if (action === "reset_data") {
      // Reset data to default
      const defaultData = JSON.stringify({
        units: [],
        bus_routes: [],
        old_routes: [],
      });

      await sql`
        INSERT INTO app_settings (key, value)
        VALUES ('app_data', ${defaultData})
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
      `;

      return res.status(200).json({ success: true });
    } else {
      return res.status(400).json({ error: "Invalid action" });
    }
  } catch (error) {
    console.error("Error in settings:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
