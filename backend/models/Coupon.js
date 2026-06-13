const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code:         { type: String, required: true, unique: true, uppercase: true, trim: true },
  discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
  discountValue:{ type: Number, required: true, min: 0 },
  active:       { type: Boolean, default: true },
  expiresAt:    { type: Date, default: null },   // null = never expires
  usageLimit:   { type: Number, default: null }, // null = unlimited
  usageCount:   { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);
