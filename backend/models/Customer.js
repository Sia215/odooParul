const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  email:       { type: String, trim: true, lowercase: true, default: '' },
  phone:       { type: String, trim: true, default: '' },
  bookedTable: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', default: null },
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
