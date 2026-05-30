const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  contact: {
    phone: String,
    email: String,
    address: String
  },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  outstandingBalance: { type: Number, default: 0 },
  totalPurchases: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  notes: String
}, { timestamps: true });

vendorSchema.index({ isActive: 1 });
vendorSchema.index({ 'name': 'text', 'contact.email': 'text', 'contact.address': 'text' });

module.exports = mongoose.models.Vendor || mongoose.model('Vendor', vendorSchema);
