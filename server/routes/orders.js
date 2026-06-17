const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Coupon = require("../models/Coupon");
const { protect } = require("../middleware/authMiddleware");
const { isAdmin } = require("../middleware/adminMiddleware");
const { queueAndSend } = require("../utils/emailWorker");

// ─────────────────────────────────────────
// POST /api/orders  —  Place a new order
// ─────────────────────────────────────────
router.post("/", protect, async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, paymentDetails, couponCode } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No order items provided." });
    }

    // Calculate amounts server-side — never trust the client
    const subtotal     = items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);
    const shippingCost = subtotal >= 5000 ? 0 : 200;

    let discountAmount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (coupon) {
        const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
        const limitReached = coupon.usedCount >= coupon.maxUses;
        const minOrderMet = subtotal >= coupon.minOrder;
        if (!isExpired && !limitReached && minOrderMet) {
          if (coupon.type === 'percent') {
            discountAmount = Math.round((subtotal * coupon.value) / 100);
          } else {
            discountAmount = coupon.value;
          }
          coupon.usedCount += 1;
          await coupon.save();
        }
      }
    }

    const totalAmount  = Math.max(0, subtotal + shippingCost - discountAmount);

    const order = await Order.create({
      user:           req.user._id,
      items,
      shippingAddress,   // keys: name, email, phone, street, city, province, postalCode
      paymentMethod,
      paymentDetails:  paymentMethod === 'bank' ? (paymentDetails || {}) : null,
      couponCode:      couponCode || "",
      discountAmount,
      subtotal,
      shippingCost,
      totalAmount,
    });

    // Create in-app notification for admin
    const Notification = require("../models/Notification");
    try {
      await Notification.create({
        type: 'new_order',
        message: `New order placed by ${req.user.name} (PKR ${totalAmount})`,
        data: { orderId: order._id }
      });
    } catch (err) {
      console.error("[orders] Notification creation error:", err);
    }

    // ── Queue confirmation email via emailWorker (has retry logic) ──
    const customerEmail = req.user.email;
    const customerName  = req.user.name;

    if (customerEmail) {
      // Customer confirmation (non-blocking)
      queueAndSend(
        "customer_order_confirmation",
        customerEmail,
        { email: customerEmail, userName: customerName, order: order.toObject() }
      ).catch(err => console.error("[orders] Email queue error:", err));

      // Admin notification (non-blocking)
      queueAndSend(
        "admin_order_notification",
        process.env.ADMIN_EMAIL || customerEmail,
        { order: order.toObject(), userName: customerName }
      ).catch(err => console.error("[orders] Email queue error:", err));
    } else {
      console.warn("[orders] No customer email on req.user — skipping email.");
    }

    res.status(201).json({ success: true, order });
  } catch (err) {
    console.error("[orders] Order creation error:", err);
    res.status(500).json({ message: err.message });
  }
});

// ─────────────────────────────────────────
// POST /api/orders/validate-coupon
// ─────────────────────────────────────────
router.post("/validate-coupon", protect, async (req, res) => {
  try {
    const { code, orderAmount } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: "Coupon code is required" });
    }
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon) {
      return res.status(404).json({ success: false, message: "Invalid coupon code" });
    }
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return res.status(400).json({ success: false, message: "Coupon has expired" });
    }
    if (coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({ success: false, message: "Coupon usage limit reached" });
    }
    if (orderAmount < coupon.minOrder) {
      return res.status(400).json({ success: false, message: `Minimum order amount of PKR ${coupon.minOrder} required` });
    }
    res.json({ success: true, coupon });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ═══════════════════════════════════════════
//  COUPON CRUD — Admin management endpoints
// ═══════════════════════════════════════════

// GET /api/orders/coupons — List all coupons (admin only)
router.get("/coupons", protect, isAdmin, async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, coupons });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/orders/coupons — Create a coupon (admin only)
router.post("/coupons", protect, isAdmin, async (req, res) => {
  try {
    const { code, type, value, minOrder, maxUses, expiresAt, isActive } = req.body;
    if (!code || !value) {
      return res.status(400).json({ success: false, message: "Code and value are required" });
    }
    const coupon = await Coupon.create({
      code: code.toUpperCase().trim(),
      type: type || 'percent',
      value: Number(value),
      minOrder: Number(minOrder || 0),
      maxUses: Number(maxUses || 100),
      expiresAt: expiresAt || undefined,
      isActive: isActive !== false,
    });
    res.status(201).json({ success: true, coupon });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: "A coupon with this code already exists" });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/orders/coupons/:id — Update a coupon (admin only)
router.put("/coupons/:id", protect, isAdmin, async (req, res) => {
  try {
    const updates = {};
    const allowed = ['code', 'type', 'value', 'minOrder', 'maxUses', 'expiresAt', 'isActive'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        if (key === 'code') updates[key] = req.body[key].toUpperCase().trim();
        else if (['value', 'minOrder', 'maxUses'].includes(key)) updates[key] = Number(req.body[key]);
        else updates[key] = req.body[key];
      }
    }
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!coupon) return res.status(404).json({ success: false, message: "Coupon not found" });
    res.json({ success: true, coupon });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: "A coupon with this code already exists" });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/orders/coupons/:id — Delete a coupon (admin only)
router.delete("/coupons/:id", protect, isAdmin, async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: "Coupon not found" });
    res.json({ success: true, message: "Coupon deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────
// GET /api/orders/my  —  Current user's orders
// ─────────────────────────────────────────
router.get("/my", protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─────────────────────────────────────────
// GET /api/orders  —  Admin/Employee: all orders (with pagination & filtering)
// ─────────────────────────────────────────
router.get("/", protect, async (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'employee') {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
  next();
}, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, paymentMethod } = req.query;
    const match = {};

    // Filter by delivery status
    if (status && status !== 'all') {
      match.deliveryStatus = status;
    }
    // Filter by payment method
    if (paymentMethod) {
      match.paymentMethod = paymentMethod;
    }

    // Employee specific filtering
    if (req.user.role === 'employee') {
      const Employee = require('../models/Employee');
      const Dealer = require('../models/Dealer');
      const emp = await Employee.findOne({ email: req.user.email.toLowerCase().trim() });
      if (emp) {
        const dealers = await Dealer.find({ employee: emp._id }).select('userId');
        const userIds = dealers.map(d => d.userId).filter(id => id);
        match.user = { $in: userIds };
      } else {
        return res.json({
          success: true,
          orders: [],
          total: 0,
          pages: 1,
          currentPage: Number(page),
        });
      }
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Math.min(100, Number(limit)));
    const total = await Order.countDocuments(match);
    const pages = Math.ceil(total / limitNum) || 1;

    const orders = await Order.find(match)
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    res.json({
      success: true,
      orders,
      total,
      pages,
      currentPage: pageNum,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────
// GET /api/orders/:id  —  Single order
// ─────────────────────────────────────────
router.get("/:id", protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("user", "name email");
    if (!order) return res.status(404).json({ message: "Order not found." });

    const isOwner = order.user && (order.user._id.toString() === req.user._id.toString() || order.user.toString() === req.user._id.toString());
    if (!isOwner && req.user.role !== "admin" && req.user.role !== "employee") {
      return res.status(403).json({ message: "Not authorised." });
    }
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─────────────────────────────────────────
// PUT & PATCH /api/orders/:id/status  —  Admin
// Accepts: { status, deliveryStatus, paymentStatus }
// ─────────────────────────────────────────
const updateOrderStatus = async (req, res) => {
  try {
    const { status, deliveryStatus, paymentStatus } = req.body;
    const updates = {};

    // Accept both "status" and "deliveryStatus" field names
    const newDeliveryStatus = deliveryStatus || status;
    if (newDeliveryStatus) {
      const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
      if (!validStatuses.includes(newDeliveryStatus)) {
        return res.status(400).json({ message: "Invalid delivery status value." });
      }
      updates.deliveryStatus = newDeliveryStatus;
    }

    // Support paymentStatus updates
    if (paymentStatus) {
      const validPayment = ["pending", "paid", "failed", "refunded", "rejected"];
      if (!validPayment.includes(paymentStatus)) {
        return res.status(400).json({ message: "Invalid payment status value." });
      }
      updates.paymentStatus = paymentStatus;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid status fields provided." });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    ).populate("user", "name email");
    if (!order) return res.status(404).json({ message: "Order not found." });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

router.patch("/:id/status", protect, isAdmin, updateOrderStatus);
router.put("/:id/status", protect, isAdmin, updateOrderStatus);

// ─────────────────────────────────────────
// DELETE /api/orders/:id  —  Admin
// ─────────────────────────────────────────
router.delete("/:id", protect, isAdmin, async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found." });
    res.json({ success: true, message: "Order deleted." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;