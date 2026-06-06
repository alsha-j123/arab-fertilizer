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
// GET /api/orders  —  Admin: all orders
// ─────────────────────────────────────────
router.get("/", protect, isAdmin, async (req, res) => {
  try {
    const orders = await Order.find().populate("user", "name email").sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─────────────────────────────────────────
// GET /api/orders/:id  —  Single order
// ─────────────────────────────────────────
router.get("/:id", protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("user", "name email");
    if (!order) return res.status(404).json({ message: "Order not found." });

    const isOwner = order.user._id.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorised." });
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─────────────────────────────────────────
// PATCH /api/orders/:id/status  —  Admin
// ─────────────────────────────────────────
router.patch("/:id/status", protect, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value." });
    }
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { deliveryStatus: status },
      { new: true }
    ).populate("user", "name email");
    if (!order) return res.status(404).json({ message: "Order not found." });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

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