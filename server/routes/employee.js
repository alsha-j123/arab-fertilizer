const express  = require('express');
const router   = express.Router();
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

// GET all employees (Admins see all, Employees see only themselves)
router.get('/', accessGuard, async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.user?.role === 'employee') {
      const emp = await Employee.findOne({ email: req.user.email.toLowerCase().trim() });
      if (emp) {
        filter._id = emp._id;
      } else {
        return res.json({ success: true, employees: [] });
      }
    }
    const employees = await Employee.find(filter).sort('-createdAt').lean();
    res.json({ success: true, employees });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET single employee
router.get('/:id', accessGuard, async (req, res) => {
  try {
    if (req.user?.role === 'employee') {
      const emp = await Employee.findOne({ email: req.user.email.toLowerCase().trim() });
      if (!emp || emp._id.toString() !== req.params.id) {
        return res.status(403).json({ success: false, message: 'Access denied: You can only view your own records' });
      }
    }
    const employee = await Employee.findById(req.params.id).lean();
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, employee });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST create employee
router.post('/', adminGuard, async (req, res) => {
  try {
    const employee = await Employee.create(req.body);
    res.status(201).json({ success: true, employee });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT update employee
router.put('/:id', adminGuard, async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, employee });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE employee (soft delete)
router.delete('/:id', adminGuard, async (req, res) => {
  try {
    await Employee.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Employee removed' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST add salary payment
router.post('/:id/salary', adminGuard, async (req, res) => {
  try {
    const { month, amount, paid, paidDate, note } = req.body;
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    employee.salaryPayments.push({ month, amount, paid: paid||false, paidDate: paidDate||null, note });
    await employee.save();
    res.json({ success: true, employee });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT update salary payment status
router.put('/:id/salary/:salaryId', adminGuard, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    const sal = employee.salaryPayments.id(req.params.salaryId);
    if (!sal) return res.status(404).json({ success: false, message: 'Salary record not found' });
    Object.assign(sal, req.body);
    if (req.body.paid && !sal.paidDate) sal.paidDate = new Date();
    await employee.save();
    res.json({ success: true, employee });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE salary payment
router.delete('/:id/salary/:salaryId', adminGuard, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    employee.salaryPayments.pull(req.params.salaryId);
    await employee.save();
    res.json({ success: true, employee });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
