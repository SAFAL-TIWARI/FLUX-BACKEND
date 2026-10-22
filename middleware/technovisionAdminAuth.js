const technovisionAdminAuth = (req, res, next) => {
  const configuredKey = process.env.TECHNOVISION_ADMIN_KEY;
  if (!configuredKey) {
    return res.status(503).json({ message: 'Technovision admin key is not configured.' });
  }

  const providedKey = req.headers['x-technovision-key'];
  if (!providedKey || providedKey !== configuredKey) {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  next();
};

module.exports = technovisionAdminAuth;