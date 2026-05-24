const { getDb } = require('../../lib/db');
const { verifyToken, getTokenFromCookie } = require('../../lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const token = getTokenFromCookie(req);
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  let userId;
  try { ({ userId } = await verifyToken(token)); }
  catch { return res.status(401).json({ error: 'Invalid token' }); }

  const q = (req.query.q || '').trim();
  if (q.length < 2) return res.json({ users: [] });

  const sql = getDb();
  const pattern = '%' + q + '%';

  const users = await sql`
    SELECT
      u.id, u.username, u.display_name, u.location, u.bio,
      (SELECT COUNT(*)::int FROM follows WHERE following_id = u.id) AS followers_count,
      (SELECT COUNT(*)::int FROM follows WHERE follower_id  = ${userId} AND following_id = u.id) > 0 AS is_following
    FROM users u
    WHERE u.id != ${userId}
      AND (u.username ILIKE ${pattern} OR u.display_name ILIKE ${pattern})
    ORDER BY u.display_name
    LIMIT 20
  `;

  return res.json({ users });
};
