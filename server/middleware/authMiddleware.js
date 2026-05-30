const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Employee = require('../models/Employee');

const protect = async (req, res, next) => {
  try {
    // 1. Prefer token stored in the HTTP-only session cookie
    // 2. Fall back to Authorization: Bearer <token> header (keeps backward compat)
    let token = req.session?.jwtToken || null;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    // Resolve employee profile by email dynamically
    if (req.user.email) {
      const employee = await Employee.findOne({ email: req.user.email.toLowerCase().trim() });
      if (employee) {
        req.user.employeeId = employee._id;
      }
    }

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token invalid or expired' });
  }
};

module.exports = { protect };
