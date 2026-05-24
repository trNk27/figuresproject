const { getDb } = require('../../lib/db');
const { verifyToken, getTokenFromCookie } = require('../../lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  let currentUserId = null;
  const token = getTokenFromCookie(req);
  if (token) {
    try { ({ userId: currentUserId } = await verifyToken(token)); } catch {}
  }

  const { username, view } = req.query;
  if (!username) return res.status(400).json({ error: 'username required' });

  const sql = getDb();
  const [user] = await sql`
    SELECT
      u.id, u.username, u.display_name, u.location, u.bio,
      u.avatar_url, u.is_private,
      (SELECT COUNT(*)::int FROM follows  WHERE following_id = u.id) AS followers_count,
      (SELECT COUNT(*)::int FROM follows  WHERE follower_id  = u.id) AS following_count,
      (SELECT COUNT(*)::int FROM harvests WHERE user_id      = u.id) AS harvest_count
    FROM users u
    WHERE u.username = ${username.toLowerCase()}
    LIMIT 1
  `;

  if (!user) return res.status(404).json({ error: 'User not found' });

  const cId = currentUserId || -1; // -1 never matches a real SERIAL id
  let isFollowing = false;
  if (currentUserId && currentUserId !== user.id) {
    const [row] = await sql`
      SELECT 1 FROM follows WHERE follower_id = ${currentUserId} AND following_id = ${user.id}
    `;
    isFollowing = !!row;
  }

  const isOwn   = currentUserId === user.id;
  const canView = isOwn || isFollowing || !user.is_private;

  if (view === 'followers') {
    const users = await sql`
      SELECT u.id, u.username, u.display_name, u.location, u.avatar_url,
        (SELECT COUNT(*)::int FROM follows WHERE following_id = u.id) AS followers_count,
        EXISTS(SELECT 1 FROM follows WHERE follower_id = ${cId} AND following_id = u.id)::bool AS is_following
      FROM follows f
      JOIN users u ON u.id = f.follower_id
      WHERE f.following_id = ${user.id}
      ORDER BY f.created_at DESC
      LIMIT 100
    `;
    return res.json({ users });
  }

  if (view === 'following') {
    const users = await sql`
      SELECT u.id, u.username, u.display_name, u.location, u.avatar_url,
        (SELECT COUNT(*)::int FROM follows WHERE following_id = u.id) AS followers_count,
        EXISTS(SELECT 1 FROM follows WHERE follower_id = ${cId} AND following_id = u.id)::bool AS is_following
      FROM follows f
      JOIN users u ON u.id = f.following_id
      WHERE f.follower_id = ${user.id}
      ORDER BY f.created_at DESC
      LIMIT 100
    `;
    return res.json({ users });
  }

  if (view === 'posts') {
    if (!canView) return res.json({ posts: null, private: true });
    const posts = await sql`
      SELECT
        p.id, p.body, p.image_url, p.created_at,
        u.id AS author_id, u.username, u.display_name, u.avatar_url,
        h.id AS harvest_id, h.species, h.distance_yards,
        h.cartridge, h.location AS harvest_location,
        (SELECT COUNT(*)::int FROM likes    WHERE post_id = p.id) AS like_count,
        (SELECT COUNT(*)::int FROM comments WHERE post_id = p.id) AS comment_count,
        EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ${cId})::bool AS liked_by_me
      FROM posts p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN harvests h ON h.id = p.harvest_id
      WHERE p.user_id = ${user.id}
      ORDER BY p.created_at DESC
      LIMIT 30
    `;
    return res.json({ posts, private: false });
  }

  return res.json({ user: { ...user, is_following: isFollowing, can_view: canView } });
};
