const { getDb } = require('../lib/db');
const { verifyToken, getTokenFromCookie } = require('../lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const token = getTokenFromCookie(req);
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  let userId;
  try { ({ userId } = await verifyToken(token)); }
  catch { return res.status(401).json({ error: 'Invalid token' }); }

  const { target_id } = req.body || {};
  if (!target_id) return res.status(400).json({ error: 'target_id required' });
  if (parseInt(target_id) === userId) return res.status(400).json({ error: 'Cannot follow yourself' });

  const sql = getDb();
  const [existing] = await sql`
    SELECT 1 FROM follows WHERE follower_id = ${userId} AND following_id = ${target_id}
  `;

  if (existing) {
    await sql`DELETE FROM follows WHERE follower_id = ${userId} AND following_id = ${target_id}`;
    return res.json({ following: false });
  } else {
    await sql`INSERT INTO follows (follower_id, following_id) VALUES (${userId}, ${target_id}) ON CONFLICT DO NOTHING`;
    return res.json({ following: true });
  }
};
