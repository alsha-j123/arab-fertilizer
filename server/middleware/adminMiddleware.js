const { protect } = require('./authMiddleware');

// adminOnly — ensures req.user is populated (via protect) and has admin role.
// If req.user is already set (because protect was called earlier in the chain),
// it skips the protect call and just checks the role.
const adminOnly = (req, res, next) => {
  const checkAdmin = () => {
    if (req.user && req.user.role === 'admin') {
      return next();
    }
    return res.status(403).json({ success: false, message: 'Access denied: Admins only' });
  };

  // If protect was already called, req.user is set — just check role
  if (req.user) {
    return checkAdmin();
  }

  // Otherwise, call protect first to extract JWT and populate req.user
  protect(req, res, (err) => {
    if (err) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    checkAdmin();
  });
};

// isAdmin is an alias for adminOnly — used by orders.js and other routes
const isAdmin = adminOnly;

module.exports = { adminOnly, isAdmin };