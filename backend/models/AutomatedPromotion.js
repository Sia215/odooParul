const mongoose = require('mongoose');

// triggerType: 'product' requires productId + minQty
// triggerType: 'order'   requires minOrderAmount
const promoSchema = new mongoose.Schema({
  name:           { type: String, required: true, trim: true },
  triggerType:    { type: String, enum: ['product', 'order'], required: true },

  // Product trigger fields
  productId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  minQty:         { type: Number, default: null, min: 1 },

  // Order trigger fields
  minOrderAmount: { type: Number, default: null, min: 0 },

  // Discount
  discountType:   { type: String, enum: ['percentage', 'fixed'], required: true },
  discountValue:  { type: Number, required: true, min: 0 },

  active:         { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('AutomatedPromotion', promoSchema);
