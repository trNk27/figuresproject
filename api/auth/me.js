const { getDb } = require('../../lib/db');
const { verifyToken, getTokenFromCookie } = require('../../lib/auth');

module.exports = async function handler(req, res) {
  const token = getTokenFromCookie(req);
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const { userId } = await verifyToken(token);
    const sql = getDb();
    const [user] = await sql`
      SELECT id, username, email, display_name, location, bio
      FROM users WHERE id = ${userId} LIMIT 1
    `;
    if (!user) return res.status(401).json({ error: 'User not found' });
    return res.json({ user });
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
};
