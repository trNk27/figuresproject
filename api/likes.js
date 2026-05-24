const { getDb } = require('../lib/db');
const { verifyToken, getTokenFromCookie } = require('../lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const token = getTokenFromCookie(req);
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  let userId;
  try { ({ userId } = await verifyToken(token)); }
  catch { return res.status(401).json({ error: 'Invalid token' }); }

  const { post_id } = req.body || {};
  if (!post_id) return res.status(400).json({ error: 'post_id required' });

  const sql = getDb();
  const [existing] = await sql`
    SELECT 1 FROM likes WHERE post_id = ${post_id} AND user_id = ${userId}
  `;

  if (existing) {
    await sql`DELETE FROM likes WHERE post_id = ${post_id} AND user_id = ${userId}`;
  } else {
    await sql`INSERT INTO likes (post_id, user_id) VALUES (${post_id}, ${userId}) ON CONFLICT DO NOTHING`;
  }

  const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM likes WHERE post_id = ${post_id}`;
  return res.json({ liked: !existing, count });
};
