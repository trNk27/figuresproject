const bcrypt = require('bcryptjs');
const { getDb } = require('../../lib/db');
const { signToken, setTokenCookie } = require('../../lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { username, email, password, display_name } = req.body || {};

  if (!username || !email || !password)
    return res.status(400).json({ error: 'username, email and password are required' });

  if (!/^[a-zA-Z0-9_]{3,30}$/.test(username))
    return res.status(400).json({ error: 'Username must be 3–30 chars, letters/numbers/underscore only' });

  if (password.length < 8)
    return res.status(400).json({ error: 'Password must be at least 8 characters' });

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: 'Invalid email address' });

  try {
    const sql = getDb();

    const existing = await sql`
      SELECT id FROM users
      WHERE email = ${email.toLowerCase()} OR username = ${username.toLowerCase()}
      LIMIT 1
    `;
    if (existing.length > 0)
      return res.status(409).json({ error: 'Username or email is already taken' });

    const hash = await bcrypt.hash(password, 12);
    const [user] = await sql`
      INSERT INTO users (username, email, password_hash, display_name)
      VALUES (${username.toLowerCase()}, ${email.toLowerCase()}, ${hash}, ${display_name || username})
      RETURNING id, username, display_name, email, location, bio
    `;

    const token = await signToken({ userId: user.id, username: user.username });
    setTokenCookie(res, token);
    return res.status(201).json({ user });
  } catch (err) {
    console.error('register error', err);
    return res.status(500).json({ error: 'Registration failed — please try again' });
  }
};
