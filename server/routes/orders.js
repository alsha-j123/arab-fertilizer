const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const { protect } = require("../middleware/authMiddleware");
const { isAdmin } = require("../middleware/adminMiddleware");
const { sendOrderConfirmation } = require("../utils/mailer");

// ─────────────────────────────────────────
// POST /api/orders  —  Place a new order
// ─────────────────────────────────────────
router.post("/", protect, async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, totalAmount } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No order items provided." });
    }

    const order = await Order.create({
      user: req.user._id,
      items,
      shippingAddress,
      paymentMethod,
      totalAmount,
      status: "pending",
    });

    // ── Send confirmation email to the CUSTOMER who placed the order ──
    const customerEmail = req.user.email; // pulled from JWT-verified user
    if (customerEmail) {
      try {
        await sendOrderConfirmation(customerEmail, order);
      } catch (mailErr) {
        // Email failure should NOT block the order response
        console.error("Email send failed (non-fatal):", mailErr.message);
      }
    } else {
      console.warn("No customer email found — skipping confirmation email.");
    }

    res.status(201).json({ success: true, order });
  } catch (err) {
    console.error("Order creation error:", err);
    res.status(500).json({ message: "Server error placing order.", error: err.message });
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
    res.status(500).json({ message: "Server error fetching orders.", error: err.message });
  }
});

// ─────────────────────────────────────────
// GET /api/orders/:id  —  Single order detail
// ─────────────────────────────────────────
router.get("/:id", protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("user", "name email");
    if (!order) return res.status(404).json({ message: "Order not found." });

    // Allow access to the order owner OR admin
    const isOwner = order.user._id.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorised to view this order." });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// ─────────────────────────────────────────
// GET /api/orders  —  Admin: all orders
// ─────────────────────────────────────────
router.get("/", protect, isAdmin, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// ─────────────────────────────────────────
// PATCH /api/orders/:id/status  —  Admin: update status
// ─────────────────────────────────────────
router.patch("/:id/status", protect, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value." });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate("user", "name email");

    if (!order) return res.status(404).json({ message: "Order not found." });

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// ─────────────────────────────────────────
// DELETE /api/orders/:id  —  Admin: delete order
// ─────────────────────────────────────────
router.delete("/:id", protect, isAdmin, async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found." });
    res.json({ success: true, message: "Order deleted." });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

module.exports = router;