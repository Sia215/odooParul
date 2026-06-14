const express = require('express');
const Order   = require('../models/Order');
const router  = express.Router();

// GET /api/kds/orders — active orders (to_cook + preparing + completed)
router.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find({
      kdsStage: { $in: ['to_cook', 'preparing', 'completed'] },
    }).sort({ kdsSentAt: 1 });

    // Auto-fix any stuck orders where all items are done but stage not updated
    for (const o of orders) {
      if (o.items.length > 0 && o.kdsItemsDone.length >= o.items.length && o.kdsStage !== 'completed') {
        o.kdsStage = 'completed';
        await o.save();
        req.app.locals.broadcast({ event: 'order:update', data: toKDS(o) });
      }
    }

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

    // Auto-advance to completed when all items are done
    const totalItems = order.items.length;
    if (order.kdsItemsDone.length >= totalItems && order.kdsStage === 'preparing') {
      order.kdsStage = 'completed';
    } else if (order.kdsItemsDone.length >= totalItems && order.kdsStage === 'to_cook') {
      order.kdsStage = 'completed';
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
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Not found' });

    const isSingleItem = order.items.length === 1;
    const kdsItemsDone = isSingleItem ? ['0'] : [];
    const kdsStage     = isSingleItem ? 'completed' : 'to_cook';

    order.kdsStage     = kdsStage;
    order.kdsSentAt    = new Date();
    order.kdsItemsDone = kdsItemsDone;
    await order.save();

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
