const express = require('express');
const Floor   = require('../models/Floor');
const Table   = require('../models/Table');

const router = express.Router();

// GET /api/floors-with-tables
router.get('/', async (req, res) => {
  try {
    const floors   = await Floor.find({ active: true }).sort({ name: 1 }).lean();
    const floorIds = floors.map((f) => f._id);

    const tables = await Table.find({ floor: { $in: floorIds }, active: true })
      .sort({ tableNumber: 1 })
      .lean();

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

module.exports = router;
