const { protect } = require('./authMiddleware');

const adminOnly = async (req, res, next) => {
  const key = req.headers['x-admin-key'] || req.query.adminKey;
  if (key && process.env.ADMIN_SECRET && key === process.env.ADMIN_SECRET) {
    return next();
  }

  // Fallback to JWT protect
  protect(req, res, () => {
    if (req.user && req.user.role === 'admin') {
      return next();
    }
    return res.status(403).json({ success: false, message: 'Access denied: Admins only' });
  });
};

module.exports = { adminOnly };
