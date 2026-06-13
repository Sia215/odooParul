const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
  tableNumber: { type: String, required: true, trim: true },
  seats:       { type: Number, required: true, min: 1, max: 50 },
  active:      { type: Boolean, default: true },
  occupied:    { type: Boolean, default: false },
  currentOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  floor:       { type: mongoose.Schema.Types.ObjectId, ref: 'Floor', required: true },
}, { timestamps: true });

// Unique table number per floor
tableSchema.index({ floor: 1, tableNumber: 1 }, { unique: true });
tableSchema.index({ floor: 1, active: 1 });

module.exports = mongoose.model('Table', tableSchema);
