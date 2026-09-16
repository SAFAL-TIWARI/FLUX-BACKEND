const recruitmentAdminAuth = (req, res, next) => {
  const key = req.headers['x-recruitment-key'] || req.headers['x-fluxwave-key'] || req.body?.key || req.query?.key;
  const validKey = process.env.RECRUITMENT_ADMIN_KEY || process.env.FLUXWAVE_ADMIN_KEY || 'flux-recruit-2026-key';

  if (!key || key !== validKey) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or missing recruitment admin key.',
    });
  }

  next();
};

module.exports = recruitmentAdminAuth;
