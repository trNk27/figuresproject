const { getDb } = require('../../lib/db');
const { verifyToken, getTokenFromCookie } = require('../../lib/auth');

module.exports = async function handler(req, res) {
  const token = getTokenFromCookie(req);
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  let userId;
  try { ({ userId } = await verifyToken(token)); }
  catch { return res.status(401).json({ error: 'Invalid token' }); }

  const postId = parseInt(req.query.id);
  if (!postId) return res.status(400).json({ error: 'Invalid post id' });

  const sql = getDb();

  if (req.method === 'GET') {
    const comments = await sql`
      SELECT c.id, c.body, c.created_at, c.user_id AS author_id,
        u.username, u.display_name, u.avatar_url
      FROM comments c
      JOIN users u ON u.id = c.user_id
      WHERE c.post_id = ${postId}
      ORDER BY c.created_at ASC
    `;
    return res.json({ comments });
  }

  if (req.method === 'POST') {
    const { body } = req.body || {};
    if (!body?.trim()) return res.status(400).json({ error: 'Comment cannot be empty' });

    const [comment] = await sql`
      WITH ins AS (
        INSERT INTO comments (post_id, user_id, body)
        VALUES (${postId}, ${userId}, ${body.trim()})
        RETURNING id, body, created_at, user_id AS author_id
      )
      SELECT i.id, i.body, i.created_at, i.author_id,
        u.username, u.display_name, u.avatar_url
      FROM ins i
      JOIN users u ON u.id = i.author_id
    `;
    return res.status(201).json({ comment });
  }

  if (req.method === 'DELETE') {
    const commentId = parseInt(req.query.comment);
    if (commentId) {
      const result = await sql`
        DELETE FROM comments WHERE id = ${commentId} AND user_id = ${userId} RETURNING id
      `;
      if (!result.length) return res.status(404).json({ error: 'Comment not found or not yours' });
      return res.json({ ok: true });
    }
    const result = await sql`
      DELETE FROM posts WHERE id = ${postId} AND user_id = ${userId} RETURNING id
    `;
    if (!result.length) return res.status(404).json({ error: 'Post not found or not yours' });
    return res.json({ ok: true });
  }

  return res.status(405).end();
};
