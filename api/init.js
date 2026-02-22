<<<<<<< HEAD
import { sql } from "@vercel/postgres";
=======
import { sql } from '@vercel/postgres';
>>>>>>> 2290907d01a2edbaf7969e4527bf77e3e8148f8c

export default async function handler(req, res) {
  try {
    // Create the table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS app_settings (
        key VARCHAR(255) PRIMARY KEY,
        value TEXT NOT NULL
      );
    `;

    // Insert default password if not exists
    await sql`
      INSERT INTO app_settings (key, value)
      VALUES ('admin_password', 'admin2024!')
      ON CONFLICT (key) DO NOTHING;
    `;

    // Insert default data if not exists
    const defaultData = JSON.stringify({
      units: [],
      bus_routes: [],
<<<<<<< HEAD
      old_routes: [],
=======
      schedules: []
>>>>>>> 2290907d01a2edbaf7969e4527bf77e3e8148f8c
    });

    await sql`
      INSERT INTO app_settings (key, value)
      VALUES ('app_data', ${defaultData})
      ON CONFLICT (key) DO NOTHING;
    `;

<<<<<<< HEAD
    return res
      .status(200)
      .json({ message: "Database initialized successfully" });
  } catch (error) {
    console.error("Error initializing database:", error);
    return res.status(500).json({ error: "Failed to initialize database" });
=======
    return res.status(200).json({ message: 'Database initialized successfully' });
  } catch (error) {
    console.error('Error initializing database:', error);
    return res.status(500).json({ error: 'Failed to initialize database' });
>>>>>>> 2290907d01a2edbaf7969e4527bf77e3e8148f8c
  }
}
