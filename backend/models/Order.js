const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name:        { type: String, required: true },
  price:       { type: Number, required: true },
  qty:         { type: Number, required: true, min: 1 },
  category:    { name: String, color: String },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  customer:    { type: String, default: 'Walk-in' },
  table:       { number: String, floor: String },
  items:       [orderItemSchema],
  subtotal:    { type: Number, required: true },
  taxAmt:      { type: Number, default: 0 },
  discountAmt: { type: Number, default: 0 },
  total:       { type: Number, required: true },
  couponCode:  { type: String, default: null },
  status:      { type: String, enum: ['Draft', 'Paid', 'Cancelled'], default: 'Draft' },
  cashierId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cashierName: { type: String },
  sessionDate: { type: Date, default: Date.now },
}, { timestamps: true });

// Auto-generate order number before save
orderSchema.pre('save', async function (next) {
  if (!this.isNew) return next();
  const count = await mongoose.model('Order').countDocuments();
  this.orderNumber = `ORD-${String(count + 1).padStart(4, '0')}`;
  next();
});

module.exports = mongoose.model('Order', orderSchema);
