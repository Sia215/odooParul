const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name:        { type: String, required: true },
  price:       { type: Number, required: true },
  qty:         { type: Number, required: true, min: 1 },
  category:    { name: String, color: String },
  kitchen_notes: { type: String, default: '' },
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

const counterSchema = new mongoose.Schema({
  _id: { type: String },
  seq: { type: Number, default: 0 },
});
const OrderCounter = mongoose.models.OrderCounter || mongoose.model('OrderCounter', counterSchema);

// Auto-generate order number before save using an atomic counter
orderSchema.pre('save', async function () {
  if (!this.isNew || this.orderNumber) return;

  const Order = mongoose.model('Order');
  const makeOrderNumber = (seq) => `ORD-${String(seq).padStart(4, '0')}`;

  const last = await Order.findOne({ orderNumber: /^ORD-\d+$/ })
    .sort({ orderNumber: -1 })
    .select('orderNumber')
    .lean();
  const lastNum = last ? parseInt(last.orderNumber.split('-')[1], 10) : 0;

  let counter = await OrderCounter.findOneAndUpdate(
    { _id: 'orderNumber' },
    {
      $max: { seq: lastNum },
      $setOnInsert: { _id: 'orderNumber' },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  counter = await OrderCounter.findOneAndUpdate(
    { _id: 'orderNumber' },
    { $inc: { seq: 1 } },
    { new: true }
  );

  let candidateNumber = makeOrderNumber(counter.seq);
  while (await Order.exists({ orderNumber: candidateNumber })) {
    counter = await OrderCounter.findOneAndUpdate(
      { _id: 'orderNumber' },
      { $inc: { seq: 1 } },
      { new: true }
    );
    candidateNumber = makeOrderNumber(counter.seq);
  }

  this.orderNumber = candidateNumber;
});

module.exports = mongoose.model('Order', orderSchema);
