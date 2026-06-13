const express  = require('express');
const Category = require('../models/Category');

const router = express.Router();

// Broadcast helper — attached via app.locals.broadcast in server.js
const broadcast = (req, payload) => {
  if (req.app.locals.broadcast) req.app.locals.broadcast(payload);
};

// GET /api/categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/categories
router.post('/', async (req, res) => {
  const { name, color } = req.body;
  if (!name) return res.status(400).json({ message: 'Name is required.' });
  try {
    const category = await Category.create({ name, color });
    broadcast(req, { type: 'CATEGORY_CREATED', category });
    res.status(201).json(category);
  } catch (err) {
    const msg = err.code === 11000 ? 'Category name already exists.' : err.message;
    res.status(400).json({ message: msg });
  }
});

// PUT /api/categories/:id
router.put('/:id', async (req, res) => {
  const { name, color } = req.body;
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name, color },
      { new: true, runValidators: true }
    );
    if (!category) return res.status(404).json({ message: 'Category not found.' });
    broadcast(req, { type: 'CATEGORY_UPDATED', category });
    res.json(category);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/categories/:id
router.delete('/:id', async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found.' });
    broadcast(req, { type: 'CATEGORY_DELETED', id: req.params.id });
    res.json({ message: 'Category deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
