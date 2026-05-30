const express  = require('express');
const router   = express.Router();
const Dealer   = require('../models/Dealer');
const Employee = require('../models/Employee');
const { protect } = require('../middleware/authMiddleware');

const accessGuard = (req, res, next) => {
  const key = req.headers['x-admin-key'] || req.query.adminKey;
  if (process.env.ADMIN_SECRET && key === process.env.ADMIN_SECRET) return next();
  
  protect(req, res, () => {
    if (req.user?.role === 'admin') return next();
    if (req.user?.role === 'employee') return next();
    return res.status(403).json({ success: false, message: 'Access denied' });
  });
};

const adminGuard = (req, res, next) => {
  const key = req.headers['x-admin-key'] || req.query.adminKey;
  if (process.env.ADMIN_SECRET && key === process.env.ADMIN_SECRET) return next();
  
  protect(req, res, () => {
    if (req.user?.role === 'admin') return next();
    return res.status(403).json({ success: false, message: 'Admin access required' });
  });
};

/* GET /api/dealers — optional ?employee=ID */
router.get('/', accessGuard, async (req, res) => {
  const match = { isActive: true };
  
  if (req.user?.role === 'employee') {
    const emp = await Employee.findOne({ email: req.user.email.toLowerCase().trim() });
    if (emp) {
      match.employee = emp._id;
    } else {
      return res.json({ success: true, dealers: [] });
    }
  } else if (req.query.employee) {
    match.employee = req.query.employee;
  }

  const dealers = await Dealer.find(match).populate('employee', 'name role area').sort('name').lean();
  res.json({ success: true, dealers });
});

/* POST /api/dealers */
router.post('/', accessGuard, async (req, res) => {
  const { name, phone, city, area, address, employee, notes } = req.body;
  
  let targetEmployeeId = employee;
  if (req.user?.role === 'employee') {
    const emp = await Employee.findOne({ email: req.user.email.toLowerCase().trim() });
    if (!emp) return res.status(400).json({ success: false, message: 'Employee profile not found' });
    targetEmployeeId = emp._id;
  }

  if (!name || !targetEmployeeId)
    return res.status(400).json({ success: false, message: 'Name and employee are required' });

  const dealer = await Dealer.create({ name, phone, city, area, address, employee: targetEmployeeId, notes });
  const populated = await Dealer.findById(dealer._id).populate('employee', 'name role area');
  res.status(201).json({ success: true, dealer: populated });
});

/* PUT /api/dealers/:id */
router.put('/:id', accessGuard, async (req, res) => {
  const existing = await Dealer.findById(req.params.id);
  if (!existing) return res.status(404).json({ success: false, message: 'Dealer not found' });

  if (req.user?.role === 'employee') {
    const emp = await Employee.findOne({ email: req.user.email.toLowerCase().trim() });
    if (!emp || existing.employee?.toString() !== emp._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied: You can only edit your own assigned dealers' });
    }
    req.body.employee = emp._id;
  }

  const dealer = await Dealer.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('employee', 'name role area');
  res.json({ success: true, dealer });
});

/* DELETE /api/dealers/:id (soft delete) */
router.delete('/:id', accessGuard, async (req, res) => {
  const existing = await Dealer.findById(req.params.id);
  if (!existing) return res.status(404).json({ success: false, message: 'Dealer not found' });

  if (req.user?.role === 'employee') {
    const emp = await Employee.findOne({ email: req.user.email.toLowerCase().trim() });
    if (!emp || existing.employee?.toString() !== emp._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied: You can only delete your own assigned dealers' });
    }
  }

  await Dealer.findByIdAndUpdate(req.params.id, { isActive: false });
  res.json({ success: true, message: 'Dealer removed' });
});

module.exports = router;
