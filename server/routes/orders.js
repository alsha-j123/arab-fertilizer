const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
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
    const totalAmount  = subtotal + shippingCost;

    const order = await Order.create({
      user:           req.user._id,
      items,
      shippingAddress,   // keys: name, email, phone, street, city, province, postalCode
      paymentMethod,
      paymentDetails:  paymentDetails || null,
      couponCode:      couponCode || "",
      subtotal,
      shippingCost,
      totalAmount,
    });

    // ── Queue confirmation email via emailWorker (has retry logic) ──
    const customerEmail = req.user.email;
    const customerName  = req.user.name;

    if (customerEmail) {
      // Customer confirmation
      await queueAndSend(
        "customer_order_confirmation",
        customerEmail,
        { email: customerEmail, userName: customerName, order: order.toObject() }
      );

      // Admin notification
      await queueAndSend(
        "admin_order_notification",
        process.env.ADMIN_EMAIL || customerEmail,
        { order: order.toObject(), userName: customerName }
      );
    } else {
      console.warn("[orders] No customer email on req.user — skipping email.");
    }

    res.status(201).json({ success: true, order });
  } catch (err) {
    console.error("[orders] Order creation error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// ─────────────────────────────────────────
// POST /api/orders/validate-coupon
// ─────────────────────────────────────────
router.post("/validate-coupon", protect, async (req, res) => {
  return res.status(404).json({ success: false, message: "Invalid coupon code" });
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