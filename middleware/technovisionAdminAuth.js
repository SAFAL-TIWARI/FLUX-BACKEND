const crypto = require('crypto');

const safeEqual = (a, b) => {
  const hashA = crypto.createHash('sha256').update(String(a)).digest();
  const hashB = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(hashA, hashB);
};

const technovisionAdminAuth = (req, res, next) => {
  const validKey = process.env.TECHNOVISION_ADMIN_KEY;

  // Fail closed: never fall back to a default key.
  if (!validKey) {
    console.error('TECHNOVISION_ADMIN_KEY is not configured.');
    return res.status(503).json({
      success: false,
      message: 'Admin access is not configured on the server.',
    });
  }

  // Header only: keys in the URL or body end up in logs and browser history.
  const key = req.headers['x-technovision-key'] || req.headers['x-admin-key'];

  if (!key || !safeEqual(key, validKey)) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or missing Technovision admin key.',
    });
  }

  next();
};

module.exports = technovisionAdminAuth;
