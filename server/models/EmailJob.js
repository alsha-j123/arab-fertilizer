const mongoose = require('mongoose');

const emailJobSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['customer_order_confirmation', 'admin_order_notification', 'forgot_password_otp', 'contact_form']
  },
  to: {
    type: String,
    required: true
  },
  subject: {
    type: String
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  attempts: {
    type: Number,
    default: 0
  },
  maxAttempts: {
    type: Number,
    default: 3
  },
  lastError: {
    type: String
  },
  nextAttemptAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Indexes for the worker to quickly find pending jobs
emailJobSchema.index({ status: 1, nextAttemptAt: 1 });

module.exports = mongoose.model('EmailJob', emailJobSchema);
