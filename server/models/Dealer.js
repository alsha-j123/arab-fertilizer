const mongoose = require('mongoose');

const dealerSchema = new mongoose.Schema({
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name:       { type: String, required: true, trim: true },
  phone:      { type: String, trim: true },
  city:       { type: String, trim: true },
  area:       { type: String, trim: true },
  address:    { type: String, trim: true },
  employee:   { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  notes:      { type: String, trim: true, default: '' },
  isActive:   { type: Boolean, default: true },
}, { timestamps: true });

dealerSchema.index({ employee: 1 });
dealerSchema.index({ city: 1 });

module.exports = mongoose.model('Dealer', dealerSchema);
