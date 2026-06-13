const express = require('express');
const bcrypt  = require('bcryptjs');
const User    = require('../models/User');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

// GET /api/employees — list all cashier accounts
router.get('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const employees = await User.find({ role: 'CASHIER' })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(employees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/employees/invite — admin creates pending employee
router.post('/invite', authMiddleware, adminOnly, async (req, res) => {
  const { name, email, phone } = req.body;
  if (!name || !email || !phone)
    return res.status(400).json({ message: 'Name, email and phone are required.' });
  try {
    if (await User.findOne({ email }))
      return res.status(409).json({ message: 'Email already registered.' });
    const employee = await User.create({
      name, email, phone,
      role: 'CASHIER', status: 'PENDING', password: null,
    });
    res.status(201).json({
      message: 'Employee invited successfully.',
      employee: { _id: employee._id, name: employee.name, email: employee.email, phone: employee.phone, status: employee.status },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/employees/:id/archive — toggle archive status
router.patch('/:id/archive', authMiddleware, adminOnly, async (req, res) => {
  try {
    const employee = await User.findById(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Employee not found.' });
    if (employee.role === 'ADMIN')
      return res.status(403).json({ message: 'Cannot archive admin accounts.' });

    employee.status = employee.status === 'ARCHIVED' ? 'ACTIVE' : 'ARCHIVED';
    await employee.save();
    res.json({ message: `Account ${employee.status.toLowerCase()}.`, status: employee.status });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/employees/:id/password — admin resets password
router.patch('/:id/password', authMiddleware, adminOnly, async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6)
    return res.status(400).json({ message: 'Password must be at least 6 characters.' });
  try {
    const employee = await User.findById(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Employee not found.' });
    employee.password = await bcrypt.hash(password, 10);
    if (employee.status === 'PENDING') employee.status = 'ACTIVE';
    await employee.save();
    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/employees/:id — hard delete
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const employee = await User.findById(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Employee not found.' });
    if (employee.role === 'ADMIN')
      return res.status(403).json({ message: 'Cannot delete admin accounts.' });
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Employee deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
