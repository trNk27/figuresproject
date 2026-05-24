const { getDb } = require('../lib/db');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const sql = getDb();
    const posts = await sql`
      SELECT
        h.id, h.species, h.date, h.distance_yards, h.cartridge,
        h.wind_mph, h.location, h.notes, h.created_at,
        u.username, u.display_name
      FROM harvests h
      JOIN users u ON h.user_id = u.id
      WHERE h.is_public = true
      ORDER BY h.created_at DESC
      LIMIT 20
    `;
    return res.json({ posts });
  } catch (err) {
    console.error('feed error', err);
    return res.status(500).json({ error: 'Failed to load feed' });
  }
};
