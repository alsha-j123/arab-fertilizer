const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Employee = require('../models/Employee');
const EmailJob = require('../models/EmailJob');
const { queueAndSend } = require('../utils/emailWorker');
const { protect } = require('../middleware/authMiddleware');
const { verifyEmailExistence } = require('../utils/emailVerifier');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

/* Store JWT in the HTTP-only session cookie */
const attachSession = (req, token) => {
  req.session.jwtToken = token;
};

const validatePasswordStrength = (password) => {
  if (!password || typeof password !== 'string') return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters long';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Password must contain at least one special symbol';
  return null; // Valid!
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'All fields required' });

    // Verify email domain existence in the real-world or allowed domain list
    const emailOk = await verifyEmailExistence(email);
    if (!emailOk) {
      return res.status(400).json({ 
        success: false, 
        message: 'The email domain could not be verified or is not allowed. Please use a valid, existing email.' 
      });
    }

    // Validate strong password requirements
    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      return res.status(400).json({ success: false, message: passwordError });
    }

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(409).json({ success: false, message: 'Email already registered' });

    const user = await User.create({ name, email, password });

    // Auto-link to Employee if email matches — but ONLY if the admin has not
    // explicitly set this user's role via User Management (roleSetByAdmin flag).
    // This prevents login from overwriting a deliberate demotion to 'customer'.
    const employee = await Employee.findOne({ email: user.email.toLowerCase().trim() });
    if (employee) {
      let changed = false;

      // Only auto-link the employeeId reference (non-destructive)
      if (user.employeeId?.toString() !== employee._id.toString()) {
        user.employeeId = employee._id;
        changed = true;
      }

      // Only auto-promote role if the admin has NOT locked it
      if (!user.roleSetByAdmin && user.role !== 'employee' && user.role !== 'admin') {
        console.log(`[AutoLink] Promoting ${user.email} to employee (roleSetByAdmin=false)`);
        user.role = 'employee';
        changed = true;
      } else if (user.roleSetByAdmin) {
        console.log(`[AutoLink] Skipping role change for ${user.email} — role locked by admin to '${user.role}'`);
      }

      if (changed) await user.save();

      if (employee.userId?.toString() !== user._id.toString()) {
        employee.userId = user._id;
        await employee.save();
      }
    }

    const token = signToken(user._id);
    attachSession(req, token);

    res.status(201).json({
      success: true, token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, employeeId: user.employeeId }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password required' });

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    // Auto-link to Employee if email matches — but ONLY if the admin has not
    // explicitly set this user's role via User Management (roleSetByAdmin flag).
    // This prevents login from overwriting a deliberate demotion to 'customer'.
    const employee = await Employee.findOne({ email: user.email.toLowerCase().trim() });
    if (employee) {
      let changed = false;

      // Only auto-link the employeeId reference (non-destructive)
      if (user.employeeId?.toString() !== employee._id.toString()) {
        user.employeeId = employee._id;
        changed = true;
      }

      // Only auto-promote role if the admin has NOT locked it
      if (!user.roleSetByAdmin && user.role !== 'employee' && user.role !== 'admin') {
        console.log(`[AutoLink] Promoting ${user.email} to employee (roleSetByAdmin=false)`);
        user.role = 'employee';
        changed = true;
      } else if (user.roleSetByAdmin) {
        console.log(`[AutoLink] Skipping role change for ${user.email} — role locked by admin to '${user.role}'`);
      }

      if (changed) await user.save();

      if (employee.userId?.toString() !== user._id.toString()) {
        employee.userId = user._id;
        await employee.save();
      }
    }

    const token = signToken(user._id);
    attachSession(req, token);

    res.json({
      success: true, token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, employeeId: user.employeeId }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// POST /api/auth/google
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential)
      return res.status(400).json({ success: false, message: 'Google credential required' });

    // Verify the ID Token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture: avatar } = payload;

    let user = await User.findOne({ $or: [{ googleId }, { email }] });
    if (user) {
      user.googleId = googleId;
      user.name = name || user.name;
      user.avatar = avatar || user.avatar;
      await user.save();
    } else {
      // Prevent auto-registration for non-existent or disallowed email domains
      const emailOk = await verifyEmailExistence(email);
      if (!emailOk) {
        return res.status(400).json({
          success: false,
          message: 'The email domain from Google could not be verified or is not allowed.'
        });
      }
      user = await User.create({ googleId, email, name, avatar });
    }

    // Auto-link to Employee if email matches — but ONLY if the admin has not
    // explicitly set this user's role via User Management (roleSetByAdmin flag).
    // This prevents login from overwriting a deliberate demotion to 'customer'.
    const employee = await Employee.findOne({ email: user.email.toLowerCase().trim() });
    if (employee) {
      let changed = false;

      // Only auto-link the employeeId reference (non-destructive)
      if (user.employeeId?.toString() !== employee._id.toString()) {
        user.employeeId = employee._id;
        changed = true;
      }

      // Only auto-promote role if the admin has NOT locked it
      if (!user.roleSetByAdmin && user.role !== 'employee' && user.role !== 'admin') {
        console.log(`[AutoLink] Promoting ${user.email} to employee (roleSetByAdmin=false)`);
        user.role = 'employee';
        changed = true;
      } else if (user.roleSetByAdmin) {
        console.log(`[AutoLink] Skipping role change for ${user.email} — role locked by admin to '${user.role}'`);
      }

      if (changed) await user.save();

      if (employee.userId?.toString() !== user._id.toString()) {
        employee.userId = user._id;
        await employee.save();
      }
    }

    const token = signToken(user._id);
    attachSession(req, token);

    res.json({
      success: true, token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, employeeId: user.employeeId }
    });
  } catch (err) {
    console.error('Google Auth Error:', err);
    res.status(500).json({ success: false, message: 'Google authentication failed' });
  }
});

// POST /api/auth/logout — destroy session and clear cookie
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destroy error:', err);
      return res.status(500).json({ success: false, message: 'Logout failed' });
    }
    res.clearCookie('af.sid');
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// GET /api/auth/me  — always re-reads from DB so role changes are reflected immediately
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Auto-link to Employee if email matches — but ONLY if the admin has not
    // explicitly locked this user's role (roleSetByAdmin flag).
    const employee = await Employee.findOne({ email: user.email.toLowerCase().trim() });
    if (employee) {
      let changed = false;

      if (user.employeeId?.toString() !== employee._id.toString()) {
        user.employeeId = employee._id;
        changed = true;
      }

      // Respect admin-set role — do NOT auto-promote if admin locked the role
      if (!user.roleSetByAdmin && user.role !== 'employee' && user.role !== 'admin') {
        console.log(`[/me AutoLink] Promoting ${user.email} to employee (roleSetByAdmin=false)`);
        user.role = 'employee';
        changed = true;
      } else if (user.roleSetByAdmin) {
        console.log(`[/me AutoLink] Skipping role change for ${user.email} — role locked by admin to '${user.role}'`);
      }

      if (changed) await user.save();

      if (employee.userId?.toString() !== user._id.toString()) {
        employee.userId = user._id;
        await employee.save();
      }
    }

    res.json({
      success: true,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, employeeId: user.employeeId }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/auth/profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id, { name, phone, address }, { new: true, runValidators: true }
    );
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/auth/make-admin  — ONE-TIME setup route
// Automatically disabled once any admin account exists in the database.
// Requires ADMIN_SECRET from .env as a secretKey in the request body.
// ─────────────────────────────────────────────────────────────
router.post('/make-admin', async (req, res) => {
  try {
    const { email, password, secretKey } = req.body;

    // Bug fix #12: Automatically block this route once an admin already exists.
    // This makes it a true one-time bootstrap endpoint, not a permanently open door.
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin account already exists. This route is disabled.'
      });
    }

    // Must pass the ADMIN_SECRET from .env — no hardcoded fallback
    if (!process.env.ADMIN_SECRET || secretKey !== process.env.ADMIN_SECRET) {
      return res.status(403).json({ success: false, message: 'Invalid secret key' });
    }

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    let user = await User.findOne({ email }).select('+password');

    if (user) {
      // Promote existing user to admin
      user.role = 'admin';
      if (password) {
        user.password = password; // will be hashed by pre-save hook
      }
      await user.save();
    } else {
      // Create fresh admin account
      user = await User.create({ name: 'Admin', email, password, role: 'admin' });
    }

    const token = signToken(user._id);
    res.json({
      success: true,
      message: `✅ ${email} is now an admin! This route is now permanently disabled.`,
      token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// PUT /api/auth/change-password
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ success: false, message: 'Both passwords required' });

    // Validate password strength
    const passwordError = validatePasswordStrength(newPassword);
    if (passwordError) {
      return res.status(400).json({ success: false, message: passwordError });
    }

    const user = await User.findById(req.user._id).select('+password');
    const match = await user.comparePassword(currentPassword);
    if (!match) return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'No account found with that email' });

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save to user with 10 min expiry
    user.resetPasswordOTP = otp;
    user.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    // Send OTP email immediately (non-blocking)
    queueAndSend('forgot_password_otp', user.email, {
      email: user.email,
      userName: user.name,
      otp
    }).catch(err => console.error("[auth] OTP email queue error:", err));

    res.json({ success: true, message: 'OTP sent to your email' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) 
      return res.status(400).json({ success: false, message: 'Email, OTP, and new password are required' });
    
    // Validate password strength
    const passwordError = validatePasswordStrength(newPassword);
    if (passwordError) {
      return res.status(400).json({ success: false, message: passwordError });
    }

    const user = await User.findOne({ 
      email,
      resetPasswordOTP: otp,
      resetPasswordExpire: { $gt: new Date() }
    }).select('+password');

    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });

    // Update password
    user.password = newPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// POST /api/auth/reset-admin-password — reset admin password from admin panel
router.post('/reset-admin-password', async (req, res) => {
  try {
    const { secretKey, newPassword } = req.body;
    if (secretKey !== process.env.ADMIN_SECRET)
      return res.status(403).json({ success: false, message: 'Invalid secret key' });
    
    // Validate password strength
    const passwordError = validatePasswordStrength(newPassword);
    if (passwordError) {
      return res.status(400).json({ success: false, message: passwordError });
    }

    // Update password for all admin users
    const users = await User.find({ role: 'admin' }).select('+password');
    for (const user of users) {
      user.password = newPassword;
      await user.save();
    }
    res.json({ success: true, message: `Password reset for ${users.length} admin account(s)` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;