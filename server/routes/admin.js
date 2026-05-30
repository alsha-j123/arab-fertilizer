const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Employee = require('../models/Employee');
const StockLedger = require('../models/StockLedger');
const Vendor = require('../models/Vendor');
const Dealer = require('../models/Dealer');
const { adminOnly } = require('../middleware/adminMiddleware');
const { protect } = require('../middleware/authMiddleware');
const productsRouter = require('./products');


/* ── Admin Login Security state (DB-persisted to survive restarts) ── */
const MAX_ATTEMPTS  = 3;
const LOCK_DURATION = 30 * 60 * 1000; // 30 minutes

// Helper: load/save lockout state from the DB via a reserved User flag
const LOCKOUT_DOC_EMAIL = '__admin_lockout__@system';

async function getLockoutState() {
  let doc = await User.findOne({ email: LOCKOUT_DOC_EMAIL }).lean();
  if (!doc) return { failedAttempts: 0, lockUntil: null };
  return { failedAttempts: doc._lockFailedAttempts || 0, lockUntil: doc._lockUntil || null };
}

async function saveLockoutState(failedAttempts, lockUntil) {
  await User.findOneAndUpdate(
    { email: LOCKOUT_DOC_EMAIL },
    { $set: { _lockFailedAttempts: failedAttempts, _lockUntil: lockUntil, role: 'customer' } },
    { upsert: true, new: true }
  );
}

// POST /api/admin/login — secure login with DB-persisted lockout
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    // Bug fix #4: No hardcoded fallback weak secrets — require env vars
    const ADMIN_EMAIL    = process.env.ADMIN_EMAIL;
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      return res.status(500).json({ success: false, message: 'Server misconfiguration: admin credentials not set' });
    }

    // Bug fix #3: Load lockout state from DB (persists across restarts)
    const { failedAttempts, lockUntil } = await getLockoutState();

    if (lockUntil && Date.now() < lockUntil) {
      const mins = Math.ceil((lockUntil - Date.now()) / 60000);
      return res.status(403).json({
        success: false,
        message: `Account locked due to multiple failed attempts. Please try again in ${mins} minutes.`,
        locked: true,
        remainingMinutes: mins
      });
    }

    const inputEmail = (email || '').trim().toLowerCase();
    const inputPass  = (password || '').trim();

    let isMatch = false;

    // 1. Check database first
    const user = await User.findOne({ email: inputEmail, role: 'admin' }).select('+password');
    if (user && user.password) {
      const bcrypt = require('bcryptjs');
      isMatch = await bcrypt.compare(inputPass, user.password);
    }

    // 2. Fallback to .env (both vars must be defined — no weak defaults)
    if (!isMatch) {
      isMatch = (inputEmail === ADMIN_EMAIL.toLowerCase().trim() && inputPass === ADMIN_PASSWORD.trim());
    }

    if (isMatch) {
      await saveLockoutState(0, null);
      return res.json({ success: true, message: 'Welcome back, Admin.' });
    } else {
      const newAttempts = failedAttempts + 1;
      if (newAttempts >= MAX_ATTEMPTS) {
        const newLockUntil = Date.now() + LOCK_DURATION;
        await saveLockoutState(newAttempts, newLockUntil);
        return res.status(403).json({
          success: false,
          message: 'Too many failed attempts. Account locked for 30 minutes.',
          locked: true,
          remainingMinutes: 30
        });
      }
      await saveLockoutState(newAttempts, null);
      return res.status(401).json({
        success: false,
        message: `Invalid email or password. ${MAX_ATTEMPTS - newAttempts} attempts remaining.`
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/login-status — check if currently locked (reads from DB)
router.get('/login-status', async (req, res) => {
  try {
    const { lockUntil } = await getLockoutState();
    if (lockUntil && Date.now() < lockUntil) {
      const mins = Math.ceil((lockUntil - Date.now()) / 60000);
      return res.json({ locked: true, remainingMinutes: mins });
    }
    res.json({ locked: false });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/change-password — verifies old password before update (Bug fix #2: adminOnly guard added)
router.post('/change-password', adminOnly, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    // Bug fix #4: No weak hardcoded fallbacks
    const ADMIN_EMAIL    = process.env.ADMIN_EMAIL;
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      return res.status(500).json({ success: false, message: 'Server misconfiguration: admin credentials not set' });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new passwords required' });
    }

    // 1. Verify current password (check DB then .env)
    let isMatch = false;
    let user = await User.findOne({ email: ADMIN_EMAIL, role: 'admin' }).select('+password');
    
    if (user && user.password) {
      const bcrypt = require('bcryptjs');
      isMatch = await bcrypt.compare(currentPassword, user.password);
    }

    if (!isMatch) {
      // Fallback check against .env
      isMatch = (currentPassword.trim() === ADMIN_PASSWORD.trim());
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    // 2. Update/Create the admin user in DB with new password
    if (user) {
      user.password = newPassword;
      await user.save();
    } else {
      user = await User.create({ 
        name: 'Admin', 
        email: ADMIN_EMAIL, 
        password: newPassword, 
        role: 'admin' 
      });
    }

    res.json({ success: true, message: 'Admin password updated successfully in database.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Access guard middleware (admin key OR authenticated admin/employee) ──
const accessGuard = (req, res, next) => {
  const key = req.headers['x-admin-key'] || req.query.adminKey;
  // Bug fix #4: No hardcoded fallback — ADMIN_SECRET must be set in environment
  if (process.env.ADMIN_SECRET && key === process.env.ADMIN_SECRET) return next();
  
  protect(req, res, () => {
    if (req.user?.role === 'admin' || req.user?.role === 'employee') return next();
    return res.status(403).json({ success: false, message: 'Access denied' });
  });
};

// GET /api/admin/dashboard
router.get('/dashboard', accessGuard, async (req, res) => {
  try {
    const today = new Date(); today.setHours(0,0,0,0);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const query = {};
    const revenueQuery = { paymentStatus: 'paid' };

    // Employee specific filtering
    if (req.user?.role === 'employee') {
      const emp = await Employee.findOne({ email: req.user.email.toLowerCase().trim() });
      if (emp) {
        const dealers = await Dealer.find({ employee: emp._id }).select('userId');
        const userIds = dealers.map(d => d.userId).filter(id => id);
        query.user = { $in: userIds };
        revenueQuery.user = { $in: userIds };
      } else {
        return res.json({
          success: true,
          stats: { totalOrders: 0, todayOrders: 0, totalRevenue: 0, lowStock: 0, activeVendors: 0, totalUsers: 0 },
          recentOrders: [],
          weeklyRevenue: []
        });
      }
    }

    const [
      totalOrders, todayOrders, totalRevenue, lowStock,
      activeVendors, totalUsers, recentOrders, weeklyRevenue
    ] = await Promise.all([
      Order.countDocuments(query),
      Order.countDocuments({ ...query, createdAt: { $gte: today } }),
      Order.aggregate([{ $match: revenueQuery }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      Product.countDocuments({ stock: { $lt: 10 }, isActive: true }),
      Vendor.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'customer' }),
      Order.find(query).populate('user', 'name email').sort('-createdAt').limit(10),
      Order.aggregate([
        { $match: { ...revenueQuery, createdAt: { $gte: weekAgo } } },
        { $group: { _id: { $dayOfWeek: '$createdAt' }, revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
        { $sort: { '_id': 1 } }
      ])
    ]);

    res.json({
      success: true,
      stats: {
        totalOrders,
        todayOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        lowStock: req.user.role === 'admin' ? lowStock : 0, // Only admin sees low stock
        activeVendors: req.user.role === 'admin' ? activeVendors : 0, // Only admin sees vendors
        totalUsers: req.user.role === 'admin' ? totalUsers : 0 // Only admin sees total users
      },
      recentOrders,
      weeklyRevenue
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/stock
router.get('/stock', accessGuard, async (req, res) => {
  const products = await Product.find({ isActive: true })
    .select('name category stock')
    .sort('stock');

  const match = {};
  if (req.user?.role === 'employee') {
    match.handledBy = req.user._id;
  }

  const ledger = await StockLedger.find(match)
    .populate('product', 'name category')
    .populate('handledBy', 'name')
    .sort('-date')
    .limit(50);
  res.json({ success: true, products, ledger });
});

// POST /api/admin/stock — log stock movement
router.post('/stock', accessGuard, async (req, res) => {
  const { productId, type, quantity, reason, unitCost, referenceVendor, notes } = req.body;
  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

  if (type === 'in') product.stock += Number(quantity);
  else if (type === 'out') {
    if (product.stock < quantity) return res.status(400).json({ success: false, message: 'Insufficient stock' });
    product.stock -= Number(quantity);
  }
  await product.save();

  // Invalidate product cache
  if (typeof productsRouter.clearProductCache === 'function') {
    productsRouter.clearProductCache();
  }


  const entry = await StockLedger.create({
    product: productId,
    type,
    quantity: Number(quantity),
    reason,
    unitCost: unitCost ? Number(unitCost) : undefined,
    totalCost: unitCost ? Number(unitCost) * Number(quantity) : undefined,
    referenceVendor,
    handledBy: req.user._id,
    notes
  });

  res.status(201).json({ success: true, entry, newStock: product.stock });
});

// GET /api/admin/ledger
router.get('/ledger', accessGuard, async (req, res) => {
  const { startDate, endDate, page = 1, limit = 50 } = req.query;
  const match = {};
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) match.createdAt.$lte = new Date(endDate);
  }
  
  if (req.user?.role === 'employee') {
    const emp = await Employee.findOne({ email: req.user.email.toLowerCase().trim() });
    if (emp) {
      const dealers = await Dealer.find({ employee: emp._id }).select('userId');
      const userIds = dealers.map(d => d.userId).filter(id => id);
      match.user = { $in: userIds };
    } else {
      match.user = null;
    }
  }

  const orders = await Order.find(match)
    .populate('user', 'name email')
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const summary = await Order.aggregate([
    { $match: match },
    { $group: {
      _id: null,
      totalSales: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$totalAmount', 0] } },
      totalCOD: { $sum: { $cond: [{ $eq: ['$paymentMethod', 'cod'] }, '$totalAmount', 0] } },
      count: { $sum: 1 }
    }}
  ]);

  res.json({ success: true, orders, summary: summary[0] || {} });
});

// GET /api/admin/users
router.get('/users', adminOnly, async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort('-createdAt');
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/users/:id/role — promote user and link to employee
router.put('/users/:id/role', adminOnly, async (req, res) => {
  try {
    const { role, employeeId } = req.body;
    if (!['admin', 'employee', 'customer'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.role = role;
    if (role === 'employee' && employeeId) {
      user.employeeId = employeeId;
      // Also update the Employee record to link back to this user
      await Employee.findByIdAndUpdate(employeeId, { userId: user._id });
    } else if (role === 'customer') {
      if (user.employeeId) {
        await Employee.findByIdAndUpdate(user.employeeId, { $unset: { userId: "" } });
      }
      user.employeeId = undefined;
    }
    
    await user.save();
    res.json({ success: true, message: `User role updated to ${role}`, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/reviews — Fetch all reviews across all products
router.get('/reviews', adminOnly, async (req, res) => {
  try {
    const products = await Product.find({ 'reviews.0': { $exists: true } })
      .select('name reviews')
      .lean();
    
    let allReviews = [];
    products.forEach(p => {
      p.reviews.forEach(r => {
        allReviews.push({
          ...r,
          productName: p.name,
          productId: p._id
        });
      });
    });

    allReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ success: true, reviews: allReviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/reviews/:productId/:reviewId — Toggle approval
router.put('/reviews/:productId/:reviewId', adminOnly, async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const review = product.reviews.id(req.params.reviewId);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

    review.isApproved = !review.isApproved;
    product.updateRating();
    await product.save();

    res.json({ success: true, message: `Review ${review.isApproved ? 'approved' : 'unapproved'}`, review });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/admin/reviews/:productId/:reviewId
router.delete('/reviews/:productId/:reviewId', adminOnly, async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    product.reviews.pull(req.params.reviewId);
    product.updateRating();
    await product.save();

    res.json({ success: true, message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/analytics — Comprehensive data for charts and reports
router.get('/analytics', adminOnly, async (req, res) => {
  try {
    const { startDate, endDate, employeeId } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    let query = { createdAt: { $gte: start, $lte: end } };

    if (employeeId && employeeId !== 'all') {
      const dealers = await Dealer.find({ employee: employeeId }).select('userId');
      const userIds = dealers.map(d => d.userId).filter(id => id);
      query.user = { $in: userIds };
    }

    const paidQuery = { ...query, paymentStatus: 'paid' };

    // 1. Overall Stats
    const [revenueData] = await Promise.all([
      Order.aggregate([
        { $match: paidQuery },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ])
    ]);
    const totalOrdersCount = await Order.countDocuments(query);

    const totalRevenue = revenueData[0]?.total || 0;
    const totalOrders = totalOrdersCount;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // 2. Daily Analytics
    const dailyStats = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          orders: { $sum: 1 },
          revenue: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$totalAmount', 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 3. Customer-wise Revenue
    const customerStats = await Order.aggregate([
      { $match: paidQuery },
      {
        $group: {
          _id: '$user',
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 }
        }
      },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userInfo' } },
      { $unwind: '$userInfo' },
      {
        $project: {
          name: '$userInfo.name',
          email: '$userInfo.email',
          revenue: 1,
          orders: 1
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 }
    ]);

    // 4. Active Employees (for filter dropdown)
    const activeEmployees = await Employee.find({ isActive: true }).select('name role');

    res.json({
      success: true,
      summary: { totalRevenue, totalOrders, avgOrderValue },
      dailyStats,
      customerStats,
      employees: activeEmployees
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
