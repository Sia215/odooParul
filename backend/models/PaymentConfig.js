const mongoose = require('mongoose');

const paymentConfigSchema = new mongoose.Schema({
  // Singleton: always one doc, identified by key
  key: { type: String, default: 'main', unique: true },

  cash: {
    enabled: { type: Boolean, default: false },
  },
  card: {
    enabled:         { type: Boolean, default: false },
  },
  upi: {
    enabled:  { type: Boolean, default: false },
    upiId:    {
      type: String,
      default: '',
      trim: true,
      validate: {
        validator: function (v) {
          // Only validate format if UPI is enabled
          if (!this.upi.enabled) return true;
          return /^[\w.\-]+@[\w]+$/.test(v);
        },
        message: 'Invalid UPI ID format (e.g. cafe@ybl)',
      },
    },
  },
}, { timestamps: true });

module.exports = mongoose.model('PaymentConfig', paymentConfigSchema);
