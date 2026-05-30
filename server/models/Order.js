const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: String,
    image: String,
    price: Number,
    weight: String,
    quantity: { type: Number, required: true, min: 1 }
  }],
  totalAmount: { type: Number, required: true },
  subtotal: { type: Number, required: true, default: 0 },
  shippingCost: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  couponCode: String,
  paymentMethod: { type: String, enum: ['cod', 'bank'], required: true },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded', 'rejected'],
    default: 'pending'
  },
  paymentDetails: {
    bankName: String,
    accountName: String,
    transactionId: String
  },
  deliveryStatus: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  shippingAddress: {
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    province: String,
    postalCode: String
  },
  orderNotes: String,
  estimatedDelivery: { type: Date },
  trackingNumber: String
}, { timestamps: true });

// Auto-set estimated delivery (3-5 business days)
orderSchema.pre('save', function (next) {
  if (this.isNew) {
    const delivery = new Date();
    delivery.setDate(delivery.getDate() + 5);
    this.estimatedDelivery = delivery;
  }
  next();
});

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ deliveryStatus: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1, createdAt: -1 });

module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema);
