const bcrypt = require('bcryptjs');
const { getDb } = require('../../lib/db');
const { signToken, setTokenCookie } = require('../../lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { login, password } = req.body || {};
  if (!login || !password)
    return res.status(400).json({ error: 'Login and password are required' });

  try {
    const sql = getDb();
    const [user] = await sql`
      SELECT id, username, email, display_name, password_hash, location, bio
      FROM users
      WHERE email = ${login.toLowerCase()} OR username = ${login.toLowerCase()}
      LIMIT 1
    `;

    if (!user || !(await bcrypt.compare(password, user.password_hash)))
      return res.status(401).json({ error: 'Invalid credentials' });

    const token = await signToken({ userId: user.id, username: user.username });
    setTokenCookie(res, token);

    const { password_hash, ...safeUser } = user;
    return res.json({ user: safeUser });
  } catch (err) {
    console.error('login error', err);
    return res.status(500).json({ error: 'Login failed — please try again' });
  }
};
