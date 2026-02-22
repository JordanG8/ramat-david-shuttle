import { sql } from "@vercel/postgres";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { action, password, newPassword } = req.body;

  if (!action || !password) {
    return res.status(400).json({ error: "Action and password are required" });
  }

  try {
    // Verify current password
    const { rows: pwdRows } = await sql`
      SELECT value FROM app_settings WHERE key = 'admin_password'
    `;

    if (pwdRows.length === 0 || pwdRows[0].value !== password) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (action === "change_password") {
      if (!newPassword) {
        return res.status(400).json({ error: "New password is required" });
      }

      await sql`
        UPDATE app_settings SET value = ${newPassword} WHERE key = 'admin_password'
      `;

      return res.status(200).json({ success: true });
    } else if (action === "reset_data") {
      // Reset data to default
      const defaultData = JSON.stringify({
        units: [],
        bus_routes: [],
        schedules: [],
      });

      await sql`
        UPDATE app_settings SET value = ${defaultData} WHERE key = 'app_data'
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
