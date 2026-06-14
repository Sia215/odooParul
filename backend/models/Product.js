const mongoose = require('mongoose');

const UNITS = ['per piece', 'per kg', 'per litre', 'per dozen', 'per plate'];

const productSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  category:    { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  price:       {
    type: Number, required: true,
    validate: { validator: (v) => v >= 0, message: 'Price must be non-negative' },
  },
  unit:        { type: String, enum: UNITS, default: 'per piece' },
  tax:         {
    type: Number, default: 0,
    validate: { validator: (v) => v >= 0 && v <= 100, message: 'Tax must be between 0 and 100' },
  },
  image:       { type: String, trim: true, default: '' },
  description: { type: String, trim: true, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
