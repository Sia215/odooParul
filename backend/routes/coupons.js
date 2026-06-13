const express = require('express');
const Coupon  = require('../models/Coupon');

const router = express.Router();

// POST /api/coupons/validate — POS cashier validates a code
router.post('/validate', async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ message: 'Code is required.' });

  const coupon = await Coupon.findOne({ code: code.toUpperCase(), active: true });
  if (!coupon) return res.status(404).json({ message: 'Invalid or inactive coupon code.' });

  if (coupon.expiresAt && new Date() > new Date(coupon.expiresAt))
    return res.status(400).json({ message: 'Coupon has expired.' });

  if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit)
    return res.status(400).json({ message: 'Coupon usage limit reached.' });

  res.json({
    code:          coupon.code,
    discountType:  coupon.discountType,
    discountValue: coupon.discountValue,
    message:       `Coupon applied: ${coupon.discountType === 'percentage' ? `${coupon.discountValue}% off` : `₹${coupon.discountValue} off`}`,
  });
});

// GET /api/coupons
router.get('/', async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.json(coupons);
});

// POST /api/coupons
router.post('/', async (req, res) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json(coupon);
  } catch (err) {
    const msg = err.code === 11000 ? 'Coupon code already exists.' : err.message;
    res.status(400).json({ message: msg });
  }
});

// PUT /api/coupons/:id
router.put('/:id', async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!coupon) return res.status(404).json({ message: 'Coupon not found.' });
    res.json(coupon);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/coupons/:id
router.delete('/:id', async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) return res.status(404).json({ message: 'Coupon not found.' });
  res.json({ message: 'Deleted.' });
});

module.exports = router;
