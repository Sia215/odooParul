const express    = require('express');
const nodemailer = require('nodemailer');
const Order      = require('../models/Order');
const User       = require('../models/User');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
// Email is taken from the logged-in user's JWT token (req.user.email)

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const INR = (v) => `&#8377;${Number(v || 0).toFixed(2)}`;

// ── Helper: build date range for "previous period" comparison ──────
function getPrevRange(from, to) {
  const diff = to - from;
  return { from: new Date(from - diff), to: new Date(from) };
}

// ── GET /api/reports  — fetch report data ──────────────────────────
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { from, to, employeeId, productName } = req.query;
    const fromDate = from ? new Date(from) : (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })();
    const toDate   = to   ? new Date(to)   : (() => { const d = new Date(); d.setHours(23,59,59,999); return d; })();

    const baseFilter = { status: 'Paid', sessionDate: { $gte: fromDate, $lte: toDate } };
    if (employeeId && employeeId !== 'all') baseFilter.cashierId = employeeId;

    const orders = await Order.find(baseFilter).sort({ total: -1 });

    // Filter by product if needed
    const filtered = productName && productName !== 'all'
      ? orders.filter(o => o.items.some(i => i.name === productName))
      : orders;

    // Metrics
    const revenue    = filtered.reduce((s, o) => s + o.total, 0);
    const totalOrders = filtered.length;
    const avgOrder   = totalOrders ? revenue / totalOrders : 0;

    // Previous period comparison
    const prev = getPrevRange(fromDate, toDate);
    const prevFilter = { status: 'Paid', sessionDate: { $gte: prev.from, $lte: prev.to } };
    if (employeeId && employeeId !== 'all') prevFilter.cashierId = employeeId;
    const prevOrders  = await Order.find(prevFilter);
    const prevRevenue = prevOrders.reduce((s, o) => s + o.total, 0);
    const prevCount   = prevOrders.length;
    const revChange = prevRevenue > 0 ? +((( revenue - prevRevenue) / prevRevenue) * 100).toFixed(1) : null;
    const ordChange = prevCount   > 0 ? +(((totalOrders - prevCount) / prevCount) * 100).toFixed(1) : null;

    // Sales trend (group by day)
    const trendMap = {};
    filtered.forEach(o => {
      const day = new Date(o.sessionDate).toISOString().slice(0, 10);
      trendMap[day] = (trendMap[day] || 0) + o.total;
    });
    const salesTrend = Object.entries(trendMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({ date, value }));

    // Top orders (top 10 by total)
    const topOrders = filtered.slice(0, 10).map(o => ({
      orderNumber: o.orderNumber,
      date:        o.sessionDate,
      customer:    o.customer,
      employee:    o.cashierName,
      table:       o.table ? `${o.table.number} · ${o.table.floor}` : '—',
      total:       o.total,
    }));

    // Top products
    const prodMap = {};
    filtered.forEach(o => o.items.forEach(i => {
      if (productName && productName !== 'all' && i.name !== productName) return;
      if (!prodMap[i.name]) prodMap[i.name] = { qty: 0, revenue: 0 };
      prodMap[i.name].qty     += i.qty;
      prodMap[i.name].revenue += i.price * i.qty;
    }));
    const topProducts = Object.entries(prodMap)
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Top categories
    const catMap = {};
    filtered.forEach(o => o.items.forEach(i => {
      const cat = i.category?.name || 'Uncategorized';
      catMap[cat] = (catMap[cat] || 0) + i.price * i.qty;
    }));
    const topCategories = Object.entries(catMap)
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue);

    // All products list for filter
    const allProductsSet = new Set();
    (await Order.find({ status: 'Paid' })).forEach(o => o.items.forEach(i => allProductsSet.add(i.name)));
    const allProducts = [...allProductsSet].sort();

    // Employees list
    const employees = await User.find({ status: 'ACTIVE' }, '_id name');

    res.json({
      metrics: { totalOrders, revenue, avgOrder, revChange, ordChange },
      salesTrend,
      topOrders,
      topProducts,
      topCategories,
      allProducts,
      employees: employees.map(e => ({ id: e._id, name: e.name })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/reports/send-email  — send full report email ─────────
router.post('/send-email', authMiddleware, async (req, res) => {
  try {
    const { period, from, to, employeeId, employeeName, productName } = req.body;

    const fromDate = from ? new Date(from) : (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })();
    const toDate   = to   ? new Date(to)   : (() => { const d = new Date(); d.setHours(23,59,59,999); return d; })();

    const baseFilter = { status: 'Paid', sessionDate: { $gte: fromDate, $lte: toDate } };
    if (employeeId && employeeId !== 'all') baseFilter.cashierId = employeeId;

    const orders = await Order.find(baseFilter).sort({ total: -1 });
    const filtered = productName && productName !== 'all'
      ? orders.filter(o => o.items.some(i => i.name === productName))
      : orders;

    const revenue     = filtered.reduce((s, o) => s + o.total, 0);
    const totalOrders = filtered.length;
    const avgOrder    = totalOrders ? revenue / totalOrders : 0;

    const topOrders = filtered.slice(0, 10);

    const prodMap = {};
    filtered.forEach(o => o.items.forEach(i => {
      if (!prodMap[i.name]) prodMap[i.name] = { qty: 0, revenue: 0 };
      prodMap[i.name].qty     += i.qty;
      prodMap[i.name].revenue += i.price * i.qty;
    }));
    const topProducts = Object.entries(prodMap)
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const catMap = {};
    filtered.forEach(o => o.items.forEach(i => {
      const cat = i.category?.name || 'Uncategorized';
      catMap[cat] = (catMap[cat] || 0) + i.price * i.qty;
    }));
    const topCategories = Object.entries(catMap)
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue);

    // ── Build HTML Email ──────────────────────────────────────────
    const periodLabel = period === 'Custom Range'
      ? `${fromDate.toLocaleDateString()} &rarr; ${toDate.toLocaleDateString()}`
      : period;

    const activeFilters = [
      `Period: <b>${periodLabel}</b>`,
      `User: <b>${employeeName || 'All'}</b>`,
      productName && productName !== 'all' ? `Product: <b>${productName}</b>` : null,
    ].filter(Boolean).join(' &nbsp;|&nbsp; ');

    const ordersRows = topOrders.map((o, idx) => `
      <tr style="background:${idx % 2 === 1 ? '#f8fafc' : 'white'}">
        <td style="padding:8px 10px;border-bottom:1px solid #f1f5f9;color:#6366f1;font-weight:600">${o.orderNumber}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #f1f5f9;color:#64748b">${new Date(o.sessionDate).toLocaleDateString()}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #f1f5f9">${o.customer || '—'}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #f1f5f9">${o.cashierName || '—'}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #f1f5f9;color:#94a3b8">${o.table ? `${o.table.number} &middot; ${o.table.floor}` : '—'}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #f1f5f9;font-weight:700">${INR(o.total)}</td>
      </tr>`).join('') ||
      `<tr><td colspan="6" style="padding:14px;text-align:center;color:#94a3b8;font-size:13px">No orders</td></tr>`;

    const productRows = topProducts.map((p, idx) => `
      <tr style="background:${idx % 2 === 1 ? '#f8fafc' : 'white'}">
        <td style="padding:8px 10px;border-bottom:1px solid #f1f5f9;font-weight:500">${p.name}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #f1f5f9;color:#64748b">${p.qty}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #f1f5f9;font-weight:700">${INR(p.revenue)}</td>
      </tr>`).join('') ||
      `<tr><td colspan="3" style="padding:14px;text-align:center;color:#94a3b8;font-size:13px">No data</td></tr>`;

    const categoryRows = topCategories.map((c, idx) => `
      <tr style="background:${idx % 2 === 1 ? '#f8fafc' : 'white'}">
        <td style="padding:8px 10px;border-bottom:1px solid #f1f5f9;font-weight:500">${c.name}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #f1f5f9;font-weight:700">${INR(c.revenue)}</td>
      </tr>`).join('') ||
      `<tr><td colspan="2" style="padding:14px;text-align:center;color:#94a3b8;font-size:13px">No data</td></tr>`;

    const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<div style="max-width:700px;margin:32px auto;background:#f8fafc;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);padding:28px 32px">
    <div style="font-size:22px;font-weight:800;color:white;letter-spacing:-0.5px">&#9749; Odoo Cafe &mdash; POS Report</div>
    <div style="margin-top:6px;color:rgba(255,255,255,0.75);font-size:13px">
      ${activeFilters} &nbsp;&middot;&nbsp; Generated: ${new Date().toLocaleString()}
    </div>
  </div>

  <div style="padding:28px 32px;background:white">

    <!-- Zone 3: Metric Cards -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
      <tr>
        <td style="width:32%;padding:18px 16px;background:#eef2ff;border-radius:12px;text-align:center;vertical-align:top">
          <div style="font-size:11px;font-weight:700;color:#6366f1;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px">Total Orders</div>
          <div style="font-size:36px;font-weight:900;color:#1e1b4b;line-height:1">${totalOrders}</div>
        </td>
        <td width="14"></td>
        <td style="width:32%;padding:18px 16px;background:#ecfdf5;border-radius:12px;text-align:center;vertical-align:top">
          <div style="font-size:11px;font-weight:700;color:#10b981;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px">Revenue</div>
          <div style="font-size:36px;font-weight:900;color:#064e3b;line-height:1">${INR(revenue)}</div>
        </td>
        <td width="14"></td>
        <td style="width:32%;padding:18px 16px;background:#fffbeb;border-radius:12px;text-align:center;vertical-align:top">
          <div style="font-size:11px;font-weight:700;color:#f59e0b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px">Average Order</div>
          <div style="font-size:36px;font-weight:900;color:#78350f;line-height:1">${INR(avgOrder)}</div>
        </td>
      </tr>
    </table>

    <!-- Divider -->
    <div style="height:1px;background:#f1f5f9;margin-bottom:24px"></div>

    <!-- Zone 5: Top Orders Table -->
    <div style="font-size:15px;font-weight:700;color:#1e293b;margin-bottom:4px">Top Orders</div>
    <div style="font-size:12px;color:#94a3b8;margin-bottom:12px">Highest value orders for the selected period</div>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:13px;margin-bottom:28px;border:1px solid #f1f5f9;border-radius:10px;overflow:hidden">
      <thead>
        <tr style="background:#f8fafc">
          <th style="padding:10px 10px;text-align:left;font-size:11px;color:#94a3b8;text-transform:uppercase;font-weight:600">Order</th>
          <th style="padding:10px 10px;text-align:left;font-size:11px;color:#94a3b8;text-transform:uppercase;font-weight:600">Date</th>
          <th style="padding:10px 10px;text-align:left;font-size:11px;color:#94a3b8;text-transform:uppercase;font-weight:600">Customer</th>
          <th style="padding:10px 10px;text-align:left;font-size:11px;color:#94a3b8;text-transform:uppercase;font-weight:600">Employee</th>
          <th style="padding:10px 10px;text-align:left;font-size:11px;color:#94a3b8;text-transform:uppercase;font-weight:600">Table</th>
          <th style="padding:10px 10px;text-align:left;font-size:11px;color:#94a3b8;text-transform:uppercase;font-weight:600">Total</th>
        </tr>
      </thead>
      <tbody>${ordersRows}</tbody>
    </table>

    <!-- Zone 6: Top Product & Top Category side by side -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr valign="top">
        <!-- Top Products -->
        <td width="48%">
          <div style="font-size:15px;font-weight:700;color:#1e293b;margin-bottom:12px">Top Product</div>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:13px;border:1px solid #f1f5f9;border-radius:10px;overflow:hidden">
            <thead>
              <tr style="background:#f8fafc">
                <th style="padding:10px;text-align:left;font-size:11px;color:#94a3b8;text-transform:uppercase;font-weight:600">Product</th>
                <th style="padding:10px;text-align:left;font-size:11px;color:#94a3b8;text-transform:uppercase;font-weight:600">Qty</th>
                <th style="padding:10px;text-align:left;font-size:11px;color:#94a3b8;text-transform:uppercase;font-weight:600">Revenue</th>
              </tr>
            </thead>
            <tbody>${productRows}</tbody>
          </table>
        </td>
        <td width="4%"></td>
        <!-- Top Categories -->
        <td width="48%">
          <div style="font-size:15px;font-weight:700;color:#1e293b;margin-bottom:12px">Top Category</div>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:13px;border:1px solid #f1f5f9;border-radius:10px;overflow:hidden">
            <thead>
              <tr style="background:#f8fafc">
                <th style="padding:10px;text-align:left;font-size:11px;color:#94a3b8;text-transform:uppercase;font-weight:600">Category</th>
                <th style="padding:10px;text-align:left;font-size:11px;color:#94a3b8;text-transform:uppercase;font-weight:600">Revenue</th>
              </tr>
            </thead>
            <tbody>${categoryRows}</tbody>
          </table>
        </td>
      </tr>
    </table>
  </div>

  <!-- Footer -->
  <div style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;text-align:center;font-size:11px;color:#94a3b8">
    Odoo Cafe POS &nbsp;&middot;&nbsp; Auto-generated report &nbsp;&middot;&nbsp; ${new Date().toLocaleDateString()}
  </div>
</div>
</body>
</html>`;

    await transporter.sendMail({
      from: `"Odoo Cafe POS" <${process.env.EMAIL_USER}>`,
      to: req.user.email,
      subject: `POS Report — ${periodLabel} · ${employeeName || 'All Users'} · ${new Date().toLocaleDateString()}`,
      html,
    });

    res.json({ message: 'Report sent to odoo210506@gmail.com' });
  } catch (err) {
    console.error('Email error:', err);
    res.status(500).json({ message: 'Failed to send email: ' + err.message });
  }
});

module.exports = router;
