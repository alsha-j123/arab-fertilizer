const express    = require('express');
const router     = express.Router();
const FuelRecord = require('../models/FuelRecord');
const Employee   = require('../models/Employee');
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

/* GET /api/fuel — list all, optional ?employee=ID&month=YYYY-MM */
router.get('/', accessGuard, async (req, res) => {
  const { employee, month } = req.query;
  const match = {};

  // If employee, they can only see their own records
  if (req.user?.role === 'employee') {
    const emp = await Employee.findOne({ email: req.user.email.toLowerCase().trim() });
    if (emp) {
      match.employee = emp._id;
    } else {
      // No employeeId linked to user
      return res.json({ success: true, records: [], totalCost: 0, totalLiters: 0 });
    }
  } else if (employee) {
    match.employee = employee;
  }

  if (month) {
    const [y, m] = month.split('-').map(Number);
    match.date = { $gte: new Date(y, m - 1, 1), $lt: new Date(y, m, 1) };
  }

  const records = await FuelRecord.find(match).populate('employee', 'name role').sort('-date').lean();
  const totalCost = records.reduce((s, r) => s + r.totalCost, 0);
  const totalLiters = records.reduce((s, r) => s + r.liters, 0);
  res.json({ success: true, records, totalCost, totalLiters });
});

/* POST /api/fuel */
router.post('/', accessGuard, async (req, res) => {
  const { employee, vehicleInfo, fuelType, liters, costPerLiter, date, odometerKm, notes } = req.body;
  
  // If employee, they can only create for themselves
  let targetEmployeeId = employee;
  if (req.user?.role === 'employee') {
    const emp = await Employee.findOne({ email: req.user.email.toLowerCase().trim() });
    if (!emp) return res.status(400).json({ success: false, message: 'Employee profile not found' });
    targetEmployeeId = emp._id;
  }

  if (!targetEmployeeId || !vehicleInfo || !liters || !costPerLiter)
    return res.status(400).json({ success: false, message: 'Employee, vehicle, liters, and cost are required' });

  const record = await FuelRecord.create({
    employee: targetEmployeeId, 
    vehicleInfo, fuelType,
    liters: Number(liters), costPerLiter: Number(costPerLiter),
    totalCost: Number(liters) * Number(costPerLiter),
    date: date || new Date(), odometerKm, notes,
  });
  const populated = await FuelRecord.findById(record._id).populate('employee', 'name role');
  res.status(201).json({ success: true, record: populated });
});

/* PUT /api/fuel/:id */
router.put('/:id', accessGuard, async (req, res) => {
  const existing = await FuelRecord.findById(req.params.id);
  if (!existing) return res.status(404).json({ success: false, message: 'Record not found' });

  // If employee, they can only edit their own
  if (req.user?.role === 'employee') {
    const emp = await Employee.findOne({ email: req.user.email.toLowerCase().trim() });
    if (!emp || existing.employee.toString() !== emp._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied: You can only edit your own records' });
    }
    req.body.employee = emp._id;
  }

  if (req.body.liters && req.body.costPerLiter)
    req.body.totalCost = Number(req.body.liters) * Number(req.body.costPerLiter);
  
  const record = await FuelRecord.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('employee', 'name role');
  res.json({ success: true, record });
});

/* DELETE /api/fuel/:id */
router.delete('/:id', accessGuard, async (req, res) => {
  const existing = await FuelRecord.findById(req.params.id);
  if (!existing) return res.status(404).json({ success: false, message: 'Record not found' });

  if (req.user?.role === 'employee') {
    const emp = await Employee.findOne({ email: req.user.email.toLowerCase().trim() });
    if (!emp || existing.employee?.toString() !== emp._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied: You can only delete your own records' });
    }
  }

  await FuelRecord.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Fuel record deleted' });
});

module.exports = router;
