const { clearTokenCookie } = require('../../lib/auth');

module.exports = function handler(req, res) {
  clearTokenCookie(res);
  res.json({ ok: true });
};
