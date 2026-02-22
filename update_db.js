import { sql } from "@vercel/postgres";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function updateDb() {
  try {
    const payload = JSON.parse(fs.readFileSync("payload.json", "utf8"));
    const dataString = JSON.stringify(payload);

    await sql`
      INSERT INTO app_settings (key, value)
      VALUES ('app_data', ${dataString})
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `;
    console.log("Database updated successfully");
  } catch (e) {
    console.error("Error updating database:", e);
  }
}

updateDb();
