import jwt from "jsonwebtoken";
import { parse } from "cookie";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_dev";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const cookies = parse(req.headers.cookie || "");
  const token = cookies.auth_token;

  if (!token) {
    return res.status(401).json({ authenticated: false });
  }

  try {
    jwt.verify(token, JWT_SECRET);
    return res.status(200).json({ authenticated: true });
  } catch (error) {
    return res.status(401).json({ authenticated: false });
  }
}
