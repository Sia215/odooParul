const express = require('express');
const Order   = require('../models/Order');
const router  = express.Router();

// GET /api/kds/orders — active orders (to_cook + preparing)
router.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find({
      kdsStage: { $in: ['to_cook', 'preparing', 'completed'] },
    }).sort({ kdsSentAt: 1 });
    res.json(orders.map(toKDS));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/kds/orders/:id/stage
router.patch('/orders/:id/stage', async (req, res) => {
  try {
    const { stage } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { kdsStage: stage },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: 'Not found' });
    req.app.locals.broadcast({ event: 'order:stage', data: toKDS(order) });
    res.json(toKDS(order));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/kds/orders/:id/items/:itemIdx
router.patch('/orders/:id/items/:itemIdx', async (req, res) => {
  try {
    const { done } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Not found' });

    const idx = req.params.itemIdx;
    if (done && !order.kdsItemsDone.includes(idx)) {
      order.kdsItemsDone.push(idx);
    } else if (!done) {
      order.kdsItemsDone = order.kdsItemsDone.filter(i => i !== idx);
    }
    await order.save();
    req.app.locals.broadcast({ event: 'order:update', data: toKDS(order) });
    res.json(toKDS(order));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/kds/orders/:id/send — called when cashier clicks "Send to Kitchen"
router.post('/orders/:id/send', async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { kdsStage: 'to_cook', kdsSentAt: new Date(), kdsItemsDone: [] },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: 'Not found' });
    req.app.locals.broadcast({ event: 'order:new', data: toKDS(order) });
    res.json(toKDS(order));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

function toKDS(order) {
  return {
    id: order._id,
    orderNumber: order.orderNumber,
    tableNumber: order.table?.number || null,
    customerName: order.customer !== 'Walk-in' ? order.customer : null,
    stage: order.kdsStage,
    receivedAt: order.kdsSentAt || order.createdAt,
    kdsItemsDone: order.kdsItemsDone || [],
    items: (order.items || []).map((it, idx) => ({
      id: String(idx),
      productName: it.name,
      category: it.category?.name || '',
      quantity: it.qty,
      showOnKDS: true,
      done: (order.kdsItemsDone || []).includes(String(idx)),
    })),
  };
}

module.exports = router;
