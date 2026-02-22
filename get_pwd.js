import { sql } from "@vercel/postgres";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function getPassword() {
  const { rows } =
    await sql`SELECT value FROM app_settings WHERE key = 'admin_password'`;
  console.log("Password:", rows[0].value);
}

getPassword();
