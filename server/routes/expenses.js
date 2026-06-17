const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const Employee = require('../models/Employee');
const ExpenseCategory = require('../models/ExpenseCategory');
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

/* ── GET /api/expenses — list all ── */
router.get('/', accessGuard, async (req, res) => {
  const { month, category, employee } = req.query;
  const match = {};

  if (req.user?.role === 'employee') {
    const emp = await Employee.findOne({ email: req.user.email.toLowerCase().trim() });
    if (emp) {
      match.employee = emp._id;
    } else {
      return res.json({ success: true, expenses: [], totalAmount: 0, byCategory: {} });
    }
  } else if (employee) {
    match.employee = employee;
  }

  if (month) {
    const [y, m] = month.split('-').map(Number);
    match.date = {
      $gte: new Date(y, m - 1, 1),
      $lt:  new Date(y, m, 1),
    };
  }
  if (category) match.category = category;

  const expenses = await Expense.find(match)
    .populate('employee', 'name')
    .populate('category', 'name color')
    .sort('-date')
    .lean();

  const totalAmount = expenses.reduce((s, e) => s + e.amount, 0);
  const byCategory = expenses.reduce((acc, e) => {
    const catName = e.category?.name || 'Uncategorized';
    acc[catName] = (acc[catName] || 0) + e.amount;
    return acc;
  }, {});

  res.json({ success: true, expenses, totalAmount, byCategory });
});

/* ── Category Management Routes ── */
router.get('/categories', accessGuard, async (req, res) => {
  const categories = await ExpenseCategory.find({ isActive: true }).sort('name');
  res.json({ success: true, categories });
});

router.post('/categories', adminGuard, async (req, res) => {
  const { name, description, color } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Name is required' });
  try {
    const category = await ExpenseCategory.create({ name, description, color });
    res.status(201).json({ success: true, category });
  } catch (err) {
    res.status(400).json({ success: false, message: err.code === 11000 ? 'Category already exists' : err.message });
  }
});

router.put('/categories/:id', adminGuard, async (req, res) => {
  const category = await ExpenseCategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ success: true, category });
});

router.delete('/categories/:id', adminGuard, async (req, res) => {
  await ExpenseCategory.findByIdAndUpdate(req.params.id, { isActive: false });
  res.json({ success: true, message: 'Category deactivated' });
});

/* ── POST /api/expenses — create ── */
router.post('/', accessGuard, async (req, res) => {
  const { title, amount, category, date, notes, employee } = req.body;
  if (!title || !amount || !category) {
    return res.status(400).json({ success: false, message: 'Title, amount, and category ID are required' });
  }

  let targetEmployeeId = employee && employee.trim() ? employee : undefined;
  if (req.user?.role === 'employee') {
    const emp = await Employee.findOne({ email: req.user.email.toLowerCase().trim() });
    if (!emp) {
      return res.status(400).json({ success: false, message: 'Employee profile not found' });
    }
    targetEmployeeId = emp._id;
  }

  const expense = await Expense.create({
    title: title.trim(),
    amount: Number(amount),
    category, // This should be an ID
    date: date || new Date(),
    notes: notes?.trim() || '',
    employee: targetEmployeeId
  });

  const populated = await Expense.findById(expense._id)
    .populate('employee', 'name')
    .populate('category', 'name color');

  res.status(201).json({ success: true, expense: populated });
});

/* ── PUT /api/expenses/:id — update ── */
router.put('/:id', accessGuard, async (req, res) => {
  const existing = await Expense.findById(req.params.id);
  if (!existing) return res.status(404).json({ success: false, message: 'Expense not found' });

  if (req.user?.role === 'employee') {
    const emp = await Employee.findOne({ email: req.user.email.toLowerCase().trim() });
    if (!emp || existing.employee?.toString() !== emp._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied: You can only edit your own expenses' });
    }
  }

  const { title, amount, category, date, notes, employee } = req.body;
  const updateData = {
    title,
    amount: Number(amount),
    category,
    date,
    notes: notes?.trim() || ''
  };

  if (req.user?.role === 'admin') {
    updateData.employee = employee && employee.trim() ? employee : null;
  }

  const expense = await Expense.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  ).populate('category', 'name color').populate('employee', 'name');
  
  res.json({ success: true, expense });
});

/* ── DELETE /api/expenses/:id ── */
router.delete('/:id', accessGuard, async (req, res) => {
  const existing = await Expense.findById(req.params.id);
  if (!existing) return res.status(404).json({ success: false, message: 'Expense not found' });

  if (req.user?.role === 'employee') {
    const emp = await Employee.findOne({ email: req.user.email.toLowerCase().trim() });
    if (!emp || existing.employee?.toString() !== emp._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied: You can only delete your own expenses' });
    }
  }

  await Expense.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Expense deleted' });
});

module.exports = router;
