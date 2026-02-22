import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { rows } = await sql`
        SELECT value FROM app_settings WHERE key = 'app_data'
      `;

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Data not found' });
      }

      const data = JSON.parse(rows[0].value);
      return res.status(200).json(data);
    } catch (error) {
      console.error('Error fetching data:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'POST') {
    const { data, password } = req.body;

    if (!data || !password) {
      return res.status(400).json({ error: 'Data and password are required' });
    }

    try {
      // Verify password first
      const { rows: pwdRows } = await sql`
        SELECT value FROM app_settings WHERE key = 'admin_password'
      `;

      if (pwdRows.length === 0 || pwdRows[0].value !== password) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Update data
      const dataString = JSON.stringify(data);
      await sql`
        UPDATE app_settings SET value = ${dataString} WHERE key = 'app_data'
      `;

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error updating data:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
