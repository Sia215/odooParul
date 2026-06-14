const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');

const router = express.Router();

const signToken = (user) => jwt.sign(
  { userId: user._id, name: user.name, email: user.email, role: user.role, status: user.status },
  process.env.JWT_SECRET,
  { expiresIn: '8h' }
);

// POST /api/signup  — creates ADMIN account
router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ message: 'All fields are required.' });
  try {
    if (await User.findOne({ email }))
      return res.status(409).json({ message: 'Email already registered.' });
    const hashed = await bcrypt.hash(password, 10);
    const user   = await User.create({ name, email, password: hashed, role: 'ADMIN', status: 'ACTIVE' });
    res.status(201).json({ message: 'Account created successfully.', userId: user._id });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// POST /api/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required.' });
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials.' });

    if (user.status === 'ARCHIVED')
      return res.status(403).json({ message: 'Account is archived. Contact admin.' });

    // PENDING cashier — no password set yet, redirect to first-time setup
    if (user.status === 'PENDING' && !user.password) {
      return res.status(200).json({
        firstTimeSetup: true,
        userId: user._id,
        name: user.name,
        message: 'Please set your password to continue.',
      });
    }

    if (!password) return res.status(400).json({ message: 'Password is required.' });
    if (!user.password) return res.status(401).json({ message: 'Invalid credentials.' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials.' });

    // Self-heal missing role (legacy accounts created before role field existed)
    if (!user.role) { user.role = 'ADMIN'; await user.save(); }

    const token = signToken(user);
    res.json({
      message:  'Login successful.',
      token,
      userId:   user._id,
      name:     user.name,
      role:     user.role,
      status:   user.status,
      // Frontend uses this to redirect: ADMIN → /admin, CASHIER → /cashier
      redirect: user.role === 'ADMIN' ? 'admin' : 'cashier',
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// POST /api/first-time-setup  — employee sets password on first login
router.post('/first-time-setup', async (req, res) => {
  const { userId, password } = req.body;
  if (!userId || !password)
    return res.status(400).json({ message: 'userId and password are required.' });
  if (password.length < 6)
    return res.status(400).json({ message: 'Password must be at least 6 characters.' });
  try {
    const user = await User.findById(userId);
    if (!user)          return res.status(404).json({ message: 'User not found.' });
    if (user.status !== 'PENDING')
      return res.status(400).json({ message: 'Account is already set up.' });

    user.password = await bcrypt.hash(password, 10);
    user.status   = 'ACTIVE';
    await user.save();

    const token = signToken(user);
    res.json({
      message:  'Password set. Account activated.',
      token,
      userId:   user._id,
      name:     user.name,
      role:     user.role,
      status:   'ACTIVE',
      redirect: 'cashier',
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

module.exports = router;
