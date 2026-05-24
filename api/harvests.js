const { getDb } = require('../lib/db');
const { verifyToken, getTokenFromCookie } = require('../lib/auth');

module.exports = async function handler(req, res) {
  const token = getTokenFromCookie(req);
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  let userId;
  try {
    ({ userId } = await verifyToken(token));
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  const sql = getDb();

  if (req.method === 'GET') {
    const harvests = await sql`
      SELECT * FROM harvests WHERE user_id = ${userId} ORDER BY created_at DESC
    `;
    return res.json({ harvests });
  }

  if (req.method === 'POST') {
    const { species, date, distance_yards, cartridge, wind_mph, location, notes, is_public } = req.body || {};
    if (!species) return res.status(400).json({ error: 'species is required' });

    const [harvest] = await sql`
      INSERT INTO harvests (user_id, species, date, distance_yards, cartridge, wind_mph, location, notes, is_public)
      VALUES (
        ${userId},
        ${species},
        ${date || null},
        ${distance_yards ? parseInt(distance_yards) : null},
        ${cartridge || null},
        ${wind_mph ? parseInt(wind_mph) : null},
        ${location || null},
        ${notes || null},
        ${is_public !== false}
      )
      RETURNING *
    `;
    return res.status(201).json({ harvest });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
