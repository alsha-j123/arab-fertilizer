const mongoose = require('mongoose');

const stockLedgerSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  type: { type: String, enum: ['in', 'out'], required: true },
  quantity: { type: Number, required: true, min: 1 },
  reason: {
    type: String,
    enum: ['purchase', 'sale', 'return', 'damage', 'adjustment', 'opening_stock'],
    required: true
  },
  referenceOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  referenceVendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  unitCost: Number,
  totalCost: Number,
  handledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: String,
  date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.models.StockLedger || mongoose.model('StockLedger', stockLedgerSchema);
