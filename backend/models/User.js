const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone:    { type: String, default: '', trim: true },
  password: { type: String, default: null },  // null until first-time setup
  role:     { type: String, enum: ['ADMIN', 'CASHIER'], default: 'ADMIN' },
  status:   { type: String, enum: ['PENDING', 'ACTIVE', 'ARCHIVED'], default: 'ACTIVE' },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
