const express = require('express');
const router  = express.Router();
const Vendor  = require('../models/Vendor');
const { protect } = require('../middleware/authMiddleware');

const adminKey = (req, res, next) => {
  const key = req.headers['x-admin-key'] || req.query.adminKey;
  if (process.env.ADMIN_SECRET && key === process.env.ADMIN_SECRET) return next();
  protect(req, res, () => {
    if (req.user?.role === 'admin') return next();
    return res.status(403).json({ success: false, message: 'Admin access required' });
  });
};

router.get('/', adminKey, async (req, res) => {
  try {
    const vendors = await Vendor.find({ isActive: true }).sort('-createdAt').lean();
    res.json({ success: true, vendors });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/:id', adminKey, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id).lean();
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });
    res.json({ success: true, vendor });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', adminKey, async (req, res) => {
  try {
    const vendor = await Vendor.create(req.body);
    res.status(201).json({ success: true, vendor });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id', adminKey, async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });
    res.json({ success: true, vendor });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:id', adminKey, async (req, res) => {
  try {
    await Vendor.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Vendor deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
