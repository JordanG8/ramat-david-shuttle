import { sql } from "@vercel/postgres";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_dev";

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
    
    // Check if the stored password is a bcrypt hash (starts with $2a$ or $2b$)
    // If not, it's the old plain text password and we should compare it directly
    // and ideally hash it, but for now just compare.
    let isMatch = false;
    if (storedPassword.startsWith("$2a$") || storedPassword.startsWith("$2b$")) {
      isMatch = await bcrypt.compare(password, storedPassword);
    } else {
      isMatch = password === storedPassword;
    }

    if (isMatch) {
      const token = jwt.sign({ role: "admin" }, JWT_SECRET, {
        expiresIn: "7d",
      });

      const cookie = serialize("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: "/",
      });

      res.setHeader("Set-Cookie", cookie);
      return res.status(200).json({ success: true });
    } else {
      return res.status(401).json({ error: "Invalid password" });
    }
  } catch (error) {
    console.error("Error verifying password:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
