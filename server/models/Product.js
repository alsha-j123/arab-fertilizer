const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  weight:        { type: String, required: true },   // e.g. "250ml", "500ml", "1 Litre"
  price:         { type: Number, required: true },
  discountPrice: { type: Number },
  stock:         { type: Number, default: 0 },
}, { _id: false });

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: {
    type: String, required: true,
    enum: ['insecticides', 'weedicides', 'fungicides', 'pgr', 'granules']
  },
  price:         { type: Number, required: true, min: 0 },  // default/base price
  discountPrice: { type: Number, min: 0 },
  images:        [{ type: String }],

  /* ── Weight variants — each has its own price ── */
  variants:      [variantSchema],   // if empty, use base price + weight fields

  /* ── Structured description ── */
  description:   { type: String, default: '' },
  features:      [{ type: String }],
  usage:         [{ type: String }],
  precautions:   [{ type: String }],

  npkRatio:      { type: String, default: 'N/A' },
  weight:        { type: String, default: 'N/A' },  // base/single weight
  season:        { type: String, default: 'All Season' },
  stock:         { type: Number, required: true, default: 0, min: 0 },
  vendor:        { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  featured:      { type: Boolean, default: false },
  specifications:{ type: Map, of: String },

  reviews: [{
    user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name:      String,
    rating:    { type: Number, min: 1, max: 5 },
    comment:   String,
    isApproved: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  avgRating:  { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
  isActive:   { type: Boolean, default: true }
}, { timestamps: true });

productSchema.methods.updateRating = function () {
  const approvedReviews = this.reviews.filter(r => r.isApproved);
  if (approvedReviews.length === 0) {
    this.avgRating = 0;
    this.numReviews = 0;
  } else {
    this.avgRating  = approvedReviews.reduce((acc, r) => acc + r.rating, 0) / approvedReviews.length;
    this.numReviews = approvedReviews.length;
  }
};

/* ── Indexes for fast queries ── */
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ featured: 1, isActive: 1 });
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ createdAt: -1 });

module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);
