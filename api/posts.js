const { getDb } = require('../lib/db');
const { verifyToken, getTokenFromCookie } = require('../lib/auth');

module.exports = async function handler(req, res) {
  const token = getTokenFromCookie(req);
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  let userId;
  try { ({ userId } = await verifyToken(token)); }
  catch { return res.status(401).json({ error: 'Invalid token' }); }

  const sql = getDb();

  if (req.method === 'GET') {
    const posts = await sql`
      SELECT
        p.id, p.body, p.image_url, p.created_at,
        u.id   AS author_id,
        u.username, u.display_name, u.avatar_url,
        h.id   AS harvest_id,
        h.species, h.distance_yards, h.cartridge,
        h.location AS harvest_location,
        h.hit_x, h.hit_y, h.escape_distance_meters,
        (SELECT COUNT(*)::int FROM likes    WHERE post_id = p.id)                             AS like_count,
        (SELECT COUNT(*)::int FROM comments WHERE post_id = p.id)                             AS comment_count,
        (SELECT COUNT(*)::int FROM likes    WHERE post_id = p.id AND user_id = ${userId}) > 0 AS liked_by_me
      FROM posts p
      JOIN  users    u ON p.user_id    = u.id
      LEFT JOIN harvests h ON p.harvest_id = h.id
      WHERE p.user_id = ${userId}
         OR p.user_id IN (SELECT following_id FROM follows WHERE follower_id = ${userId})
      ORDER BY p.created_at DESC
      LIMIT 50
    `;
    return res.json({ posts });
  }

  if (req.method === 'POST') {
    const { body, image_url, harvest_id } = req.body || {};
    if (!body && !image_url)
      return res.status(400).json({ error: 'Post needs text or an image' });

    if (harvest_id) {
      const [own] = await sql`
        SELECT id FROM harvests WHERE id = ${parseInt(harvest_id)} AND user_id = ${userId}
      `;
      if (!own) return res.status(403).json({ error: 'Harvest not yours' });
    }

    const [post] = await sql`
      INSERT INTO posts (user_id, body, image_url, harvest_id)
      VALUES (${userId}, ${body || null}, ${image_url || null}, ${harvest_id ? parseInt(harvest_id) : null})
      RETURNING id, body, image_url, harvest_id, created_at
    `;
    return res.status(201).json({ post });
  }

  return res.status(405).end();
};
