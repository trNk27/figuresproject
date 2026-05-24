const { SignJWT, jwtVerify } = require('jose');

const COOKIE = 'tm_token';
const MAX_AGE = 7 * 24 * 3600; // 7 days

function getSecret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET env var is not set');
  return new TextEncoder().encode(s);
}

async function signToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret());
}

async function verifyToken(token) {
  const { payload } = await jwtVerify(token, getSecret());
  return payload;
}

function getTokenFromCookie(req) {
  const cookie = req.headers.cookie || '';
  const m = cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  return m ? m[1] : null;
}

function setTokenCookie(res, token) {
  res.setHeader('Set-Cookie',
    `${COOKIE}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${MAX_AGE}`
  );
}

function clearTokenCookie(res) {
  res.setHeader('Set-Cookie',
    `${COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`
  );
}

module.exports = { signToken, verifyToken, getTokenFromCookie, setTokenCookie, clearTokenCookie };
