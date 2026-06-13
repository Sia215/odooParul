const express       = require('express');
const PaymentConfig = require('../models/PaymentConfig');

const router = express.Router();

// GET /api/payment-methods — fetch current config (used by both admin + POS checkout)
router.get('/', async (req, res) => {
  try {
    let config = await PaymentConfig.findOne({ key: 'main' });
    if (!config) config = await PaymentConfig.create({ key: 'main' });
    res.json(config);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/payment-methods — admin saves toggle states + UPI ID
router.put('/', async (req, res) => {
  const { cash, card, upi } = req.body;

  // Validate: UPI ID must be present and valid if UPI is being enabled
  if (upi?.enabled) {
    if (!upi.upiId || !upi.upiId.trim()) {
      return res.status(400).json({ message: 'UPI ID is required when UPI QR is enabled.' });
    }
    if (!/^[\w.\-]+@[\w]+$/.test(upi.upiId.trim())) {
      return res.status(400).json({ message: 'Invalid UPI ID format (e.g. cafe@ybl).' });
    }
  }

  try {
    const config = await PaymentConfig.findOneAndUpdate(
      { key: 'main' },
      { cash, card, upi },
      { new: true, upsert: true, runValidators: false } // custom validation above
    );
    res.json({ message: 'Payment config saved.', config });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
