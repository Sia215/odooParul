const express = require('express');
const Floor   = require('../models/Floor');
const Table   = require('../models/Table');

const router = express.Router();

// ── OPTIMIZED POS ENDPOINT ──────────────────────────────────────
// GET /api/floors-with-tables
// Returns only active floors, each with their active tables nested
router.get('/floors-with-tables', async (req, res) => {
  try {
    const floors = await Floor.find({ active: true }).sort({ name: 1 }).lean();
    const floorIds = floors.map((f) => f._id);

    const tables = await Table.find({ floor: { $in: floorIds }, active: true })
      .sort({ tableNumber: 1 })
      .lean();

    // Group tables under their floor
    const tablesByFloor = {};
    tables.forEach((t) => {
      const key = t.floor.toString();
      if (!tablesByFloor[key]) tablesByFloor[key] = [];
      tablesByFloor[key].push(t);
    });

    const result = floors.map((f) => ({
      ...f,
      tables: tablesByFloor[f._id.toString()] || [],
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── FLOOR CRUD ──────────────────────────────────────────────────
// GET /api/floors
router.get('/floors', async (req, res) => {
  try {
    const floors = await Floor.find().sort({ name: 1 });
    res.json(floors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/floors
router.post('/floors', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'Floor name is required.' });
  try {
    const floor = await Floor.create({ name });
    res.status(201).json(floor);
  } catch (err) {
    const msg = err.code === 11000 ? 'Floor name already exists.' : err.message;
    res.status(400).json({ message: msg });
  }
});

// PUT /api/floors/:id
router.put('/floors/:id', async (req, res) => {
  try {
    const floor = await Floor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!floor) return res.status(404).json({ message: 'Floor not found.' });
    res.json(floor);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/floors/:id
router.delete('/floors/:id', async (req, res) => {
  try {
    const floor = await Floor.findByIdAndDelete(req.params.id);
    if (!floor) return res.status(404).json({ message: 'Floor not found.' });
    await Table.deleteMany({ floor: req.params.id }); // cascade delete tables
    res.json({ message: 'Floor and its tables deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── TABLE CRUD ──────────────────────────────────────────────────
// GET /api/tables?floor=id
router.get('/tables', async (req, res) => {
  try {
    const filter = req.query.floor ? { floor: req.query.floor } : {};
    const tables = await Table.find(filter).populate('floor', 'name').sort({ tableNumber: 1 });
    res.json(tables);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/tables
router.post('/tables', async (req, res) => {
  const { tableNumber, seats, floor } = req.body;
  if (!tableNumber || !seats || !floor)
    return res.status(400).json({ message: 'tableNumber, seats and floor are required.' });
  try {
    const table = await Table.create({ tableNumber, seats, floor });
    res.status(201).json(table);
  } catch (err) {
    const msg = err.code === 11000 ? 'Table number already exists on this floor.' : err.message;
    res.status(400).json({ message: msg });
  }
});

// PUT /api/tables/:id
router.put('/tables/:id', async (req, res) => {
  try {
    const table = await Table.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!table) return res.status(404).json({ message: 'Table not found.' });
    res.json(table);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH /api/tables/:id/status  — quick active toggle
router.patch('/tables/:id/status', async (req, res) => {
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
router.delete('/tables/:id', async (req, res) => {
  try {
    const table = await Table.findByIdAndDelete(req.params.id);
    if (!table) return res.status(404).json({ message: 'Table not found.' });
    res.json({ message: 'Table deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
