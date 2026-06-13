const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name:  { type: String, required: true, trim: true, unique: true },
  color: {
    type: String,
    required: true,
    default: '#6366f1',
    validate: {
      validator: (v) => /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(v),
      message:   'Color must be a valid hex code (e.g. #fff or #ffffff)',
    },
  },
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
