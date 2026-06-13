const express            = require('express');
const AutomatedPromotion = require('../models/AutomatedPromotion');

const router = express.Router();

// GET /api/promotions
router.get('/', async (req, res) => {
  const promos = await AutomatedPromotion.find().populate('productId', 'name').sort({ createdAt: -1 });
  res.json(promos);
});

// POST /api/promotions
router.post('/', async (req, res) => {
  const { name, triggerType, productId, minQty, minOrderAmount, discountType, discountValue } = req.body;
  if (!name || !triggerType || !discountType || discountValue === undefined)
    return res.status(400).json({ message: 'name, triggerType, discountType and discountValue are required.' });
  if (triggerType === 'product' && (!productId || !minQty))
    return res.status(400).json({ message: 'productId and minQty are required for product trigger.' });
  if (triggerType === 'order' && (minOrderAmount === undefined || minOrderAmount === null || minOrderAmount === ''))
    return res.status(400).json({ message: 'minOrderAmount is required for order trigger.' });
  try {
    const promo = await AutomatedPromotion.create(req.body);
    res.status(201).json(promo);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/promotions/:id
router.put('/:id', async (req, res) => {
  try {
    const promo = await AutomatedPromotion.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!promo) return res.status(404).json({ message: 'Promotion not found.' });
    res.json(promo);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/promotions/:id
router.delete('/:id', async (req, res) => {
  const promo = await AutomatedPromotion.findByIdAndDelete(req.params.id);
  if (!promo) return res.status(404).json({ message: 'Promotion not found.' });
  res.json({ message: 'Deleted.' });
});

module.exports = router;
