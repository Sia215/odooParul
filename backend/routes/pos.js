const express                = require('express');
const { calculateOrderTotal } = require('../utils/pricingEngine');

const router = express.Router();

// POST /api/pos/calculate
// Body: { cartItems: [...], couponCode: string|null, taxRate: number }
router.post('/calculate', async (req, res) => {
  const { cartItems, couponCode, taxRate } = req.body;
  if (!Array.isArray(cartItems) || cartItems.length === 0)
    return res.status(400).json({ message: 'cartItems array is required.' });
  try {
    const result = await calculateOrderTotal(cartItems, couponCode || null, taxRate || 0);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
