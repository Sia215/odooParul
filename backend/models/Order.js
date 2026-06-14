const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name:        { type: String, required: true },
  price:       { type: Number, required: true },
  qty:         { type: Number, required: true, min: 1 },
  category:    { name: String, color: String },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  customer:    { type: String, default: 'Walk-in' },
  customerEmail: { type: String, default: '' },
  table:       { number: String, floor: String },
  items:       [orderItemSchema],
  subtotal:    { type: Number, required: true },
  taxAmt:      { type: Number, default: 0 },
  discountAmt: { type: Number, default: 0 },
  total:       { type: Number, required: true },
  couponCode:    { type: String, default: null },
  paymentMethod: { type: String, default: 'cash' },
  status:        { type: String, enum: ['Draft', 'Paid', 'Cancelled'], default: 'Draft' },
  kdsStage:    { type: String, enum: ['to_cook', 'preparing', 'completed', 'archived'], default: null },
  kdsSentAt:   { type: Date, default: null },
  kdsItemsDone: { type: [String], default: [] }, // array of item index strings marked done
  cashierId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cashierName: { type: String },
  sessionDate: { type: Date, default: Date.now },
}, { timestamps: true });

// Auto-generate order number before save
orderSchema.pre('save', async function () {
  if (!this.isNew || this.orderNumber) return;
  const last = await mongoose.model('Order').findOne({}, { orderNumber: 1 }).sort({ createdAt: -1 });
  const lastNum = last?.orderNumber ? parseInt(last.orderNumber.replace('ORD-', ''), 10) : 0;
  const next = isNaN(lastNum) ? 1 : lastNum + 1;
  this.orderNumber = `ORD-${String(next).padStart(4, '0')}`;
});

module.exports = mongoose.model('Order', orderSchema);
