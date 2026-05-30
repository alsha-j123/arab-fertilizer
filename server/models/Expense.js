const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  title:    { type: String, required: true, trim: true },
  amount:   { type: Number, required: true, min: 0 },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'ExpenseCategory', required: true },
  date:     { type: Date, required: true, default: Date.now },
  notes:    { type: String, trim: true, default: '' },
}, { timestamps: true });

/* ── Indexes for fast queries ── */
expenseSchema.index({ date: -1 });
expenseSchema.index({ category: 1 });

module.exports = mongoose.model('Expense', expenseSchema);
