const mongoose = require('mongoose');
const couponSchema = new mongoose.Schema({
  code:      { type: String, required: true, unique: true, uppercase: true, trim: true },
  type:      { type: String, enum: ['percent','fixed'], default: 'percent' },
  value:     { type: Number, required: true },
  minOrder:  { type: Number, default: 0 },
  maxUses:   { type: Number, default: 100 },
  usedCount: { type: Number, default: 0 },
  expiresAt: { type: Date },
  isActive:  { type: Boolean, default: true },
}, { timestamps: true });
module.exports = mongoose.models.Coupon || mongoose.model('Coupon', couponSchema);
