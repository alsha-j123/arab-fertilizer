const mongoose = require('mongoose');

const salaryPaymentSchema = new mongoose.Schema({
  month:     { type: String, required: true }, // e.g. "2024-03"
  amount:    { type: Number, required: true },
  paid:      { type: Boolean, default: false },
  paidDate:  { type: Date },
  note:      { type: String },
}, { _id: true, timestamps: true });

const employeeSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name:        { type: String, required: true, trim: true },
  role:        { type: String, required: true }, // e.g. "Sales Manager"
  phone:       { type: String },
  email:       { type: String },
  address:     { type: String },
  area:        { type: String },
  region:      { type: String },
  joinDate:    { type: Date, default: Date.now },
  baseSalary:  { type: Number, required: true, default: 0 },
  status:      { type: String, enum: ['active','inactive'], default: 'active' },
  salaryPayments: [salaryPaymentSchema],
  notes:       { type: String },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

employeeSchema.index({ role: 1 });
employeeSchema.index({ isActive: 1 });

module.exports = mongoose.models.Employee || mongoose.model('Employee', employeeSchema);
