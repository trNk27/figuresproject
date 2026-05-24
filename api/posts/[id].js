const { getDb } = require('../../lib/db');
const { verifyToken, getTokenFromCookie } = require('../../lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'DELETE') return res.status(405).end();

  const token = getTokenFromCookie(req);
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  let userId;
  try { ({ userId } = await verifyToken(token)); }
  catch { return res.status(401).json({ error: 'Invalid token' }); }

  const postId = parseInt(req.query.id);
  if (!postId) return res.status(400).json({ error: 'Invalid post id' });

  const sql = getDb();
  const result = await sql`
    DELETE FROM posts WHERE id = ${postId} AND user_id = ${userId}
    RETURNING id
  `;

  if (!result.length) return res.status(404).json({ error: 'Post not found or not yours' });
  return res.json({ ok: true });
};
