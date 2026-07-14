const eventAdminAuth = (req, res, next) => {
  const key = req.headers['x-fluxwave-key'];

  if (!process.env.FLUXWAVE_ADMIN_KEY) {
    return res.status(500).json({ message: 'FLUXWAVE_ADMIN_KEY not set on server' });
  }

  if (!key || key !== process.env.FLUXWAVE_ADMIN_KEY) {
    return res.status(401).json({ message: 'Invalid or missing admin key' });
  }

  next();
};

module.exports = eventAdminAuth;