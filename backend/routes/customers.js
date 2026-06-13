const express  = require('express');
const Customer = require('../models/Customer');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/customers?search=
router.get('/', authMiddleware, async (req, res) => {
  try {
    const filter = req.query.search
      ? { $or: [
          { name:  { $regex: req.query.search, $options: 'i' } },
          { email: { $regex: req.query.search, $options: 'i' } },
          { phone: { $regex: req.query.search, $options: 'i' } },
        ] }
      : {};
    const customers = await Customer.find(filter).sort({ name: 1 });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/customers
router.post('/', authMiddleware, async (req, res) => {
  const { name, email, phone } = req.body;
  if (!name) return res.status(400).json({ message: 'Name is required.' });
  try {
    const customer = await Customer.create({ name, email, phone });
    res.status(201).json(customer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/customers/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!customer) return res.status(404).json({ message: 'Customer not found.' });
    res.json(customer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/customers/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found.' });
    res.json({ message: 'Deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/customers/:id/book-table  — link customer to a table
router.patch('/:id/book-table', authMiddleware, async (req, res) => {
  const { tableId } = req.body;
  try {
    // Release any existing booking on this table first
    if (tableId) await Customer.updateMany({ bookedTable: tableId }, { bookedTable: null });
    const customer = await Customer.findByIdAndUpdate(req.params.id, { bookedTable: tableId || null }, { new: true });
    if (!customer) return res.status(404).json({ message: 'Customer not found.' });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/customers/booked-tables  — which table IDs are booked
router.get('/booked-tables', authMiddleware, async (req, res) => {
  try {
    const booked = await Customer.find({ bookedTable: { $ne: null } }).select('bookedTable name');
    res.json(booked.map((c) => ({ tableId: c.bookedTable, customerName: c.name })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
