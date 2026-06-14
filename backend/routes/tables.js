const express = require('express');
const Table   = require('../models/Table');

const router = express.Router();

// GET /api/tables?floor=id
router.get('/', async (req, res) => {
  try {
    const filter = req.query.floor ? { floor: req.query.floor } : {};
    const tables = await Table.find(filter).populate('floor', 'name').sort({ tableNumber: 1 });
    res.json(tables);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/tables
router.post('/', async (req, res) => {
  const { tableNumber, seats, floor, shape } = req.body;
  if (!tableNumber || !seats || !floor)
    return res.status(400).json({ message: 'tableNumber, seats and floor are required.' });
  try {
    const table = await Table.create({ tableNumber, seats, floor, shape });
    res.status(201).json(table);
  } catch (err) {
    const msg = err.code === 11000 ? 'Table number already exists on this floor.' : err.message;
    res.status(400).json({ message: msg });
  }
});

// PUT /api/tables/:id
router.put('/:id', async (req, res) => {
  try {
    const table = await Table.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!table) return res.status(404).json({ message: 'Table not found.' });
    res.json(table);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH /api/tables/:id/occupy  — mark table occupied or free
router.patch('/:id/occupy', async (req, res) => {
  try {
    const { occupied, orderId } = req.body;
    const table = await Table.findByIdAndUpdate(
      req.params.id,
      { occupied: !!occupied, currentOrderId: occupied ? (orderId || null) : null },
      { new: true }
    ).populate('floor', 'name');
    if (!table) return res.status(404).json({ message: 'Table not found.' });
    // Broadcast to all connected POS clients
    req.app.locals.broadcast({ type: 'TABLE_UPDATE', table });
    res.json(table);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/tables/:id/status  — toggle active
router.patch('/:id/status', async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) return res.status(404).json({ message: 'Table not found.' });
    table.active = !table.active;
    await table.save();
    res.json(table);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/tables/:id
router.delete('/:id', async (req, res) => {
  try {
    const table = await Table.findByIdAndDelete(req.params.id);
    if (!table) return res.status(404).json({ message: 'Table not found.' });
    res.json({ message: 'Table deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
