const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, select: false },
  googleId: { type: String },
  avatar: { type: String },
  role: { type: String, enum: ['customer', 'admin', 'employee'], default: 'customer' },
  // When an admin explicitly sets a role via User Management, this flag is set to true.
  // It prevents the auto-link logic from overwriting the role on every login.
  roleSetByAdmin: { type: Boolean, default: false },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  orderHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  phone: { type: String },
  resetPasswordOTP: { type: String },
  resetPasswordExpire: { type: Date },
  address: {
    street: String,
    city: String,
    province: String,
    postalCode: String
  }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);