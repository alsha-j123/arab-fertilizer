// adminOnly — checks req.user is already set by protect middleware
// and that the user has admin role. Never calls protect internally.
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Access denied: Admins only' });
};

// isAdmin is an alias for adminOnly — used by orders.js and other routes
const isAdmin = adminOnly;

module.exports = { adminOnly, isAdmin };