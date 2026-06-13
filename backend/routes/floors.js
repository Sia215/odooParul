const express = require('express');
const Floor   = require('../models/Floor');
const Table   = require('../models/Table');

const router = express.Router();

// GET /api/floors
router.get('/', async (req, res) => {
  try {
    const floors = await Floor.find().sort({ name: 1 });
    res.json(floors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/floors
router.post('/', async (req, res) => {
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
router.put('/:id', async (req, res) => {
  try {
    const floor = await Floor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!floor) return res.status(404).json({ message: 'Floor not found.' });
    res.json(floor);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/floors/:id  — cascades to tables
router.delete('/:id', async (req, res) => {
  try {
    const floor = await Floor.findByIdAndDelete(req.params.id);
    if (!floor) return res.status(404).json({ message: 'Floor not found.' });
    await Table.deleteMany({ floor: req.params.id });
    res.json({ message: 'Floor and its tables deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
