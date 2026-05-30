const mongoose = require('mongoose');

const expenseCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String, trim: true },
  color: { type: String, default: '#2D5A27' }, // Optional for UI coloring
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('ExpenseCategory', expenseCategorySchema);
