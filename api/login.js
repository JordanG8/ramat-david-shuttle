import { sql } from "@vercel/postgres";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: "Password is required" });
  }

  try {
    const { rows } = await sql`
      SELECT value FROM app_settings WHERE key = 'admin_password'
    `;

    if (rows.length === 0) {
      return res
        .status(500)
        .json({ error: "Admin password not set in database" });
    }

    const storedPassword = rows[0].value;

    if (password === storedPassword) {
      // In a real app, you'd return a JWT or session token here.
      // For this simple app, we'll just return success.
      return res.status(200).json({ success: true });
    } else {
      return res.status(401).json({ error: "Invalid password" });
    }
  } catch (error) {
    console.error("Error verifying password:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
