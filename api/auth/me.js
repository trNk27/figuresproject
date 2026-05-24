const { getDb } = require('../../lib/db');
const { verifyToken, getTokenFromCookie } = require('../../lib/auth');

module.exports = async function handler(req, res) {
  const token = getTokenFromCookie(req);
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  let userId;
  try { ({ userId } = await verifyToken(token)); }
  catch { return res.status(401).json({ error: 'Invalid or expired session' }); }

  const sql = getDb();

  if (req.method === 'GET') {
    const [user] = await sql`
      SELECT
        u.id, u.username, u.email, u.display_name, u.location, u.bio,
        u.equipment, u.avatar_url, u.is_private,
        (SELECT COUNT(*)::int FROM follows WHERE following_id = u.id) AS followers_count,
        (SELECT COUNT(*)::int FROM follows WHERE follower_id  = u.id) AS following_count
      FROM users u WHERE u.id = ${userId} LIMIT 1
    `;
    if (!user) return res.status(401).json({ error: 'User not found' });
    return res.json({ user });
  }

  if (req.method === 'PATCH') {
    const { display_name, location, bio, equipment, avatar_url, is_private } = req.body || {};
    const [user] = await sql`
      UPDATE users SET
        display_name = ${display_name ?? null},
        location     = ${location ?? null},
        bio          = ${bio ?? null},
        equipment    = ${equipment ?? null},
        avatar_url   = ${avatar_url ?? null},
        is_private   = ${typeof is_private === 'boolean' ? is_private : false}
      WHERE id = ${userId}
      RETURNING
        id, username, email, display_name, location, bio,
        equipment, avatar_url, is_private,
        (SELECT COUNT(*)::int FROM follows WHERE following_id = ${userId}) AS followers_count,
        (SELECT COUNT(*)::int FROM follows WHERE follower_id  = ${userId}) AS following_count
    `;
    return res.json({ user });
  }

  return res.status(405).end();
};
