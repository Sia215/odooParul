const express    = require('express');
const nodemailer = require('nodemailer');
const Order      = require('../models/Order');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

function getTransporter() {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
}

const INR = (v) => `₹${Number(v || 0).toFixed(2)}`;

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

// POST /api/orders/:id/send-bill — send bill to customer email
router.post('/:id/send-bill', authMiddleware, async (req, res) => {
  try {
    const { customerEmail } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    const to = customerEmail || req.user.email;

    const itemRows = order.items.map((i, idx) => `
      <tr style="background:${idx % 2 === 1 ? '#f8fafc' : 'white'}">
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9">${i.name}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:center">${i.qty}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:right">${INR(i.price)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:600">${INR(i.price * i.qty)}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<div style="max-width:500px;margin:32px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
  <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:24px 28px">
    <div style="font-size:20px;font-weight:800;color:white">&#9749; The Velvet Bean Co.</div>
    <div style="color:rgba(255,255,255,0.75);font-size:13px;margin-top:4px">Artisan Roasters &amp; Kitchen &middot; ${order.orderNumber}</div>
  </div>
  <div style="padding:24px 28px">
    <table style="width:100%;font-size:13px;border-collapse:collapse;margin-bottom:20px">
      <thead>
        <tr style="background:#f8fafc">
          <th style="padding:8px 12px;text-align:left;font-size:11px;color:#94a3b8;text-transform:uppercase">Item</th>
          <th style="padding:8px 12px;text-align:center;font-size:11px;color:#94a3b8;text-transform:uppercase">Qty</th>
          <th style="padding:8px 12px;text-align:right;font-size:11px;color:#94a3b8;text-transform:uppercase">Price</th>
          <th style="padding:8px 12px;text-align:right;font-size:11px;color:#94a3b8;text-transform:uppercase">Total</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>
    <div style="border-top:2px solid #f1f5f9;padding-top:16px">
      <div style="display:flex;justify-content:space-between;font-size:13px;color:#64748b;margin-bottom:6px">
        <span>Subtotal</span><span>${INR(order.subtotal)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:13px;color:#64748b;margin-bottom:6px">
        <span>Tax</span><span>${INR(order.taxAmt)}</span>
      </div>
      ${order.discountAmt > 0 ? `<div style="display:flex;justify-content:space-between;font-size:13px;color:#10b981;margin-bottom:6px"><span>Discount</span><span>-${INR(order.discountAmt)}</span></div>` : ''}
      <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:800;color:#1e293b;margin-top:10px;padding-top:10px;border-top:1px solid #e2e8f0">
        <span>Total</span><span style="color:#4f46e5">${INR(order.total)}</span>
      </div>
    </div>
    <div style="margin-top:20px;padding:12px;background:#f8fafc;border-radius:10px;font-size:12px;color:#64748b">
      <div>Customer: <b>${order.customer || 'Walk-in'}</b></div>
      <div>Table: <b>${order.table?.number ? `${order.table.number} &middot; ${order.table.floor}` : '—'}</b></div>
      <div>Date: <b>${new Date(order.sessionDate).toLocaleString()}</b></div>
      <div>Payment: <b>${(order.paymentMethod || 'cash').toUpperCase()}</b></div>
    </div>
  </div>
  <div style="background:#f8fafc;padding:14px 28px;text-align:center;font-size:11px;color:#94a3b8;border-top:1px solid #e2e8f0">
    Thank you for visiting The Velvet Bean Co.! &#9749;
  </div>
</div>
</body></html>`;

    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"Odoo Cafe" <${process.env.EMAIL_USER}>`,
      to,
      subject: `Your Bill from The Velvet Bean Co. — ${order.orderNumber} — ${INR(order.total)}`,
      html,
    });
    res.json({ message: `Bill sent to ${to}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to send bill: ' + err.message });
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
