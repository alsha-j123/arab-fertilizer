const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect } = require('../middleware/authMiddleware');
const { queueAndSend } = require('../utils/emailWorker');

/* POST /api/notifications/contact — public contact form */
router.post('/contact', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // 1. Create In-App Notification for Admin
    Notification.create({
      type: 'system',
      message: `New contact message from ${name}`,
      data: { email, subject }
    }).catch(err => console.error('[notifications] Failed to create notification:', err.message));

    // 2. Send contact email immediately (with queue fallback for retries)
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      queueAndSend('contact_form', adminEmail, { name, email, phone, subject, message })
        .catch(err => console.error('[notifications] Failed to queue contact email:', err.message));
    } else {
      console.warn('[notifications] ADMIN_EMAIL not set — contact form email skipped');
    }

    res.json({ success: true, message: 'Message sent successfully' });
  } catch (err) {
    console.error('[notifications] Contact form error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

const adminKey = (req, res, next) => {
  const key = req.headers['x-admin-key'] || req.query.adminKey;
  if (process.env.ADMIN_SECRET && key === process.env.ADMIN_SECRET) return next();
  protect(req, res, () => {
    if (req.user?.role === 'admin') return next();
    return res.status(403).json({ success: false, message: 'Admin access required' });
  });
};

/* GET /api/notifications — admin gets all notifications */
router.get('/', adminKey, async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const notifications = await Notification.find()
      .sort('-createdAt')
      .limit(Number(limit))
      .lean();

    const unreadCount = await Notification.countDocuments({ read: false });

    res.json({ success: true, notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* PUT /api/notifications/read-all — mark all as read */
router.put('/read-all', adminKey, async (req, res) => {
  try {
    await Notification.updateMany({ read: false }, { read: true });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* PUT /api/notifications/:id/read — mark as read */
router.put('/:id/read', adminKey, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.json({ success: true, notification });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;