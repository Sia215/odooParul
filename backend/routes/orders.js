const express = require('express');
const Order   = require('../models/Order');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/orders?date=YYYY-MM-DD  — session orders (today by default)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const date  = req.query.date ? new Date(req.query.date) : new Date();
    const start = new Date(date); start.setHours(0, 0, 0, 0);
    const end   = new Date(date); end.setHours(23, 59, 59, 999);

    const orders = await Order.find({ sessionDate: { $gte: start, $lte: end } })
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/orders/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/orders  — create new order (Draft or Paid)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { orderNumber: _ignored, ...body } = req.body;
    const order = new Order({ ...body, cashierId: req.user.userId, cashierName: req.user.name });
    await order.save();
    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH /api/orders/:id  — update (edit draft or mark paid/cancelled)
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    if (order.status === 'Paid')
      return res.status(403).json({ message: 'Paid orders cannot be modified.' });

    Object.assign(order, req.body);
    // When marking as Paid, update sessionDate and cashier to the paying employee
    if (req.body.status === 'Paid') {
      order.sessionDate = new Date();
      order.cashierId   = req.user.userId;
      order.cashierName = req.user.name;
    }
    await order.save();
    res.json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/orders/:id  — only Draft orders
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    if (order.status !== 'Draft')
      return res.status(403).json({ message: 'Only Draft orders can be deleted.' });
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: 'Order deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
