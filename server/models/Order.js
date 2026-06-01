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
    const { items, shippingAddress, paymentMethod, paymentDetails, couponCode } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No order items provided." });
    }

    // Calculate all amounts server-side
    const subtotal     = items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);
    const shippingCost = subtotal >= 5000 ? 0 : 200;
    const totalAmount  = subtotal + shippingCost;

    const order = await Order.create({
      user:            req.user._id,
      items,
      shippingAddress,          // keys must match schema: name, street, phone, city
      paymentMethod,
      paymentDetails:  paymentDetails || null,
      couponCode:      couponCode || '',
      subtotal,
      shippingCost,
      totalAmount,
      status:          "pending",
    });

    // Send confirmation email to the customer
    const customerEmail = req.user.email;
    if (customerEmail) {
      try {
        await sendOrderConfirmation(customerEmail, order);
      } catch (mailErr) {
        console.error("Email send failed (non-fatal):", mailErr.message);
      }
    }

    res.status(201).json({ success: true, order });
  } catch (err) {
    console.error("Order creation error:", err.message);
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

// TEMPORARY DEBUG — no auth needed, remove after fixing
router.get("/test-email-debug", async (req, res) => {
  try {
    console.log("EMAIL_USER set:", !!process.env.EMAIL_USER);
    console.log("EMAIL_PASS set:", !!process.env.EMAIL_PASS);
    console.log("EMAIL_USER value:", process.env.EMAIL_USER);

    const nodemailer = require("nodemailer");
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `"Arab Fertilizers" <${process.env.EMAIL_USER}>`,
      to: "ayeshajavid310@gmail.com",
      subject: "Test Email Debug",
      html: "<p>If you see this, email is working!</p>",
    });

    res.json({ 
      success: true, 
      messageId: info.messageId,
      EMAIL_USER: process.env.EMAIL_USER,
      EMAIL_PASS_SET: !!process.env.EMAIL_PASS,
      EMAIL_PASS_LENGTH: (process.env.EMAIL_PASS || "").length
    });
  } catch (err) {
    res.json({ 
      success: false, 
      error: err.message,
      EMAIL_USER: process.env.EMAIL_USER,
      EMAIL_PASS_SET: !!process.env.EMAIL_PASS,
      EMAIL_PASS_LENGTH: (process.env.EMAIL_PASS || "").length
    });
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