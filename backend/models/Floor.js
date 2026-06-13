const mongoose = require('mongoose');

const floorSchema = new mongoose.Schema({
  name:   { type: String, required: true, trim: true, unique: true },
  active: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Floor', floorSchema);
