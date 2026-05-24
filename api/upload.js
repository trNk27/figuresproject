const { put } = require('@vercel/blob');
const { verifyToken, getTokenFromCookie } = require('../lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const token = getTokenFromCookie(req);
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  let userId;
  try { ({ userId } = await verifyToken(token)); }
  catch { return res.status(401).json({ error: 'Invalid token' }); }

  const { data } = req.body || {};
  if (!data) return res.status(400).json({ error: 'No image data' });

  const base64 = data.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64, 'base64');

  if (buffer.length > 8 * 1024 * 1024)
    return res.status(400).json({ error: 'Image must be under 8 MB after compression' });

  const ext  = (data.match(/^data:image\/(\w+);/) || [])[1] || 'jpg';
  const name = `posts/${userId}/${Date.now()}.${ext}`;

  try {
    const blob = await put(name, buffer, {
      access: 'public',
      contentType: `image/${ext}`,
    });
    return res.json({ url: blob.url });
  } catch (err) {
    console.error('upload error', err);
    return res.status(500).json({ error: 'Upload failed' });
  }
};

module.exports.config = {
  api: { bodyParser: { sizeLimit: '12mb' } },
};
