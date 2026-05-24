const { getDb } = require('../../lib/db');
const { verifyToken, getTokenFromCookie } = require('../../lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  let currentUserId = null;
  const token = getTokenFromCookie(req);
  if (token) {
    try { ({ userId: currentUserId } = await verifyToken(token)); } catch {}
  }

  const { username } = req.query;
  if (!username) return res.status(400).json({ error: 'username required' });

  const sql = getDb();
  const [user] = await sql`
    SELECT
      u.id, u.username, u.display_name, u.location, u.bio,
      (SELECT COUNT(*)::int FROM follows   WHERE following_id = u.id) AS followers_count,
      (SELECT COUNT(*)::int FROM follows   WHERE follower_id  = u.id) AS following_count,
      (SELECT COUNT(*)::int FROM harvests  WHERE user_id      = u.id) AS harvest_count
    FROM users u
    WHERE u.username = ${username.toLowerCase()}
    LIMIT 1
  `;

  if (!user) return res.status(404).json({ error: 'User not found' });

  let isFollowing = false;
  if (currentUserId && currentUserId !== user.id) {
    const [row] = await sql`
      SELECT 1 FROM follows WHERE follower_id = ${currentUserId} AND following_id = ${user.id}
    `;
    isFollowing = !!row;
  }

  return res.json({ user: { ...user, is_following: isFollowing } });
};
