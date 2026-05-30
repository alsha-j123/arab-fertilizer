const express  = require('express');
const router   = express.Router();
const Order    = require('../models/Order');
const Product  = require('../models/Product');
const Dealer   = require('../models/Dealer');
const Employee = require('../models/Employee');
const { protect } = require('../middleware/authMiddleware');
const EmailJob = require('../models/EmailJob');
const Notification = require('../models/Notification');
const Coupon   = require('../models/Coupon');
const productsRouter = require('./products');


const accessGuard = (req, res, next) => {
  const key = req.headers['x-admin-key'] || req.query.adminKey;
  // Bug fix #4: No hardcoded fallback — ADMIN_SECRET must be set in environment
  if (process.env.ADMIN_SECRET && key === process.env.ADMIN_SECRET) return next();

  protect(req, res, () => {
    if (req.user?.role === 'admin') return next();
    if (req.user?.role === 'employee') return next();
    return res.status(403).json({ success: false, message: 'Access denied' });
  });
};

const adminGuard = (req, res, next) => {
  const key = req.headers['x-admin-key'] || req.query.adminKey;
  // Bug fix #4: No hardcoded fallback — ADMIN_SECRET must be set in environment
  if (process.env.ADMIN_SECRET && key === process.env.ADMIN_SECRET) return next();

  protect(req, res, () => {
    if (req.user?.role === 'admin') return next();
    return res.status(403).json({ success: false, message: 'Admin access required' });
  });
};

/* POST /api/orders — place order (requires login) */
router.post('/', protect, async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, paymentDetails, orderNotes, couponCode } = req.body;
    if (!items || items.length === 0)
      return res.status(400).json({ success: false, message: 'No items in order' });

    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) return res.status(404).json({ success: false, message: `Product not found: ${item.product}` });

      let price = 0;
      let weight = '';
      let name = '';
      let isVariantUsed = false;

      if (item.weight && product.variants && product.variants.length > 0) {
        const variant = product.variants.find(v => v.weight === item.weight);
        if (variant) {
          if (variant.stock < item.quantity) {
            return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name} (${variant.weight})` });
          }
          price = variant.discountPrice !== undefined && variant.discountPrice !== null ? variant.discountPrice : variant.price;
          weight = variant.weight;
          name = `${product.name} (${variant.weight})`;
          variant.stock -= item.quantity;
          product.markModified('variants');
          isVariantUsed = true;
        }
      }

      if (!isVariantUsed) {
        if (product.stock < item.quantity) {
          return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}` });
        }
        price = product.discountPrice !== undefined && product.discountPrice !== null ? product.discountPrice : product.price;
        weight = product.weight || 'N/A';
        name = product.name;
        product.stock -= item.quantity;
      }

      subtotal += price * item.quantity;
      orderItems.push({
        product:  product._id,
        name,
        image:    product.images?.[0] || '',
        price,
        weight,
        quantity: item.quantity
      });

      await product.save();
      if (typeof productsRouter.clearProductCache === 'function') {
        productsRouter.clearProductCache();
      }

    }

    const shippingCost = subtotal >= 5000 ? 0 : 200;
    let discountAmount = 0;
    let coupon = null;

    if (couponCode) {
      coupon = await Coupon.findOne({ code: couponCode.toUpperCase().trim(), isActive: true });
      if (!coupon) {
        return res.status(400).json({ success: false, message: 'Invalid coupon code' });
      }
      if (coupon.expiresAt && new Date() > coupon.expiresAt) {
        return res.status(400).json({ success: false, message: 'Coupon has expired' });
      }
      if (coupon.usedCount >= coupon.maxUses) {
        return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
      }
      if (subtotal < coupon.minOrder) {
        return res.status(400).json({ success: false, message: `Minimum order PKR ${coupon.minOrder.toLocaleString()} required for this coupon` });
      }

      discountAmount = coupon.type === 'percent'
        ? Math.round((subtotal * coupon.value) / 100)
        : Math.min(coupon.value, subtotal);

      // Bug fix #6: Atomic increment to prevent race condition — two simultaneous
      // requests can no longer both pass the usedCount check and double-apply the coupon.
      const atomicResult = await Coupon.findOneAndUpdate(
        { _id: coupon._id, usedCount: { $lt: coupon.maxUses } },
        { $inc: { usedCount: 1 } },
        { new: true }
      );
      if (!atomicResult) {
        return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
      }
    }

    const totalAmount = subtotal + shippingCost - discountAmount;

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      subtotal,
      shippingCost,
      discountAmount,
      couponCode: coupon ? coupon.code : '',
      totalAmount,
      paymentMethod:  paymentMethod  || 'cod',
      shippingAddress: shippingAddress || {},
      orderNotes:     orderNotes     || '',
      paymentDetails:  paymentDetails || null,
      paymentStatus:  'pending',
      deliveryStatus: 'pending'
    });

    /* Queue Customer Email */
    await EmailJob.create({
      type: 'customer_order_confirmation',
      to: req.user.email,
      data: { email: req.user.email, userName: req.user.name, order }
    });
    
    /* Queue Admin Email */
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      await EmailJob.create({
        type: 'admin_order_notification',
        to: adminEmail,
        data: { order, userName: req.user.name }
      });
    }

    /* Create Admin In-App Notification */
    await Notification.create({
      type: 'new_order',
      message: `New order placed by ${req.user.name}`,
      data: { orderId: order._id }
    });

    res.status(201).json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* GET /api/orders/my — customer's own orders */
router.get('/my', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('items.product', 'name images')
      .sort('-createdAt')
      .lean();
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* GET /api/orders — admin/employee gets orders */
router.get('/', accessGuard, async (req, res) => {
  try {
    const { status, paymentStatus, paymentMethod: pmFilter, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.deliveryStatus = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (pmFilter) query.paymentMethod = pmFilter;

    // Employee specific filtering
    if (req.user?.role === 'employee') {
      const emp = await Employee.findOne({ email: req.user.email.toLowerCase().trim() });
      if (emp) {
        const dealers = await Dealer.find({ employee: emp._id }).select('userId');
        const userIds = dealers.map(d => d.userId).filter(id => id);
        query.user = { $in: userIds };
      } else {
        return res.json({ success: true, orders: [], total: 0, pages: 0, currentPage: 1 });
      }
    }

    const orders = await Order.find(query)
      .populate('user', 'name email phone')
      .select('user totalAmount subtotal shippingCost discountAmount couponCode paymentMethod paymentStatus deliveryStatus createdAt paymentDetails shippingAddress orderNotes items') 
      .sort('-createdAt')
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();

    const total = await Order.countDocuments(query);
    res.json({ 
      success: true, 
      orders, 
      total,
      pages: Math.ceil(total / Number(limit)),
      currentPage: Number(page)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ── Coupon validation ── */
router.post('/validate-coupon', protect, async (req, res) => {
  try {
    const { code, orderAmount } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Coupon code required' });
    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim(), isActive: true });
    if (!coupon) return res.status(404).json({ success: false, message: 'Invalid coupon code' });
    if (coupon.expiresAt && new Date() > coupon.expiresAt)
      return res.status(400).json({ success: false, message: 'Coupon has expired' });
    if (coupon.usedCount >= coupon.maxUses)
      return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
    if (orderAmount < coupon.minOrder)
      return res.status(400).json({ success: false, message: `Minimum order PKR ${coupon.minOrder.toLocaleString()} required` });
    const discount = coupon.type === 'percent'
      ? Math.round((orderAmount * coupon.value) / 100)
      : Math.min(coupon.value, orderAmount);
    res.json({ success: true, coupon: { code: coupon.code, type: coupon.type, value: coupon.value, discount } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

/* ── Coupon CRUD (admin) ── */
router.get('/coupons', adminGuard, async (req, res) => {
  try { const coupons = await Coupon.find().sort('-createdAt').lean(); res.json({ success: true, coupons }); }
  catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
router.post('/coupons', adminGuard, async (req, res) => {
  try { const c = await Coupon.create({ ...req.body, code: req.body.code?.toUpperCase() }); res.status(201).json({ success: true, coupon: c }); }
  catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
router.put('/coupons/:id', adminGuard, async (req, res) => {
  try { const c = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json({ success: true, coupon: c }); }
  catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
router.delete('/coupons/:id', adminGuard, async (req, res) => {
  try { await Coupon.findByIdAndDelete(req.params.id); res.json({ success: true }); }
  catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

/* GET /api/orders/:id */
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('items.product', 'name images category')
      .lean();
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    
    // Authorization: Admin can see all, Employee can see their dealers' orders, User can see their own
    let isAuthorized = (req.user.role === 'admin');
    if (!isAuthorized && req.user.role === 'employee') {
      const emp = await Employee.findOne({ email: req.user.email.toLowerCase().trim() });
      if (emp) {
        const dealer = await Dealer.findOne({ userId: order.user?._id, employee: emp._id });
        if (dealer) isAuthorized = true;
      }
    }
    if (!isAuthorized && order.user?._id?.toString() === req.user._id.toString()) {
      isAuthorized = true;
    }

    if (!isAuthorized)
      return res.status(403).json({ success: false, message: 'Not authorized' });
    
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* PUT /api/orders/:id/status — admin updates status */
router.put('/:id/status', adminGuard, async (req, res) => {
  try {
    const { deliveryStatus, paymentStatus, paymentMethod } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (deliveryStatus === 'cancelled' && order.deliveryStatus !== 'cancelled') {
      // Bug fix #5: Restore stock at the correct level — variant stock if the item
      // used a variant, otherwise the root product stock.
      for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (!product) continue;

        // If the order item has a weight, try to restore variant stock
        let restoredVariant = false;
        if (item.weight && product.variants && product.variants.length > 0) {
          const variant = product.variants.find(v => v.weight === item.weight);
          if (variant) {
            variant.stock += item.quantity;
            product.markModified('variants');
            restoredVariant = true;
          }
        }

        // Fallback: restore root stock if no matching variant found
        if (!restoredVariant) {
          product.stock += item.quantity;
        }

        await product.save();
      }
    }

    const update = {};
    if (deliveryStatus) update.deliveryStatus = deliveryStatus;
    if (paymentStatus)  update.paymentStatus  = paymentStatus;
    if (paymentMethod)  update.paymentMethod  = paymentMethod;
    const updated = await Order.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json({ success: true, order: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* DELETE /api/orders/:id — admin deletes order */
router.delete('/:id', adminGuard, async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Order deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
