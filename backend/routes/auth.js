const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '30d' });

// @GET /api/auth/setup-status - whether the system still needs its first account created
router.get('/setup-status', async (req, res) => {
  try {
    const count = await User.countDocuments();
    res.json({ success: true, data: { needsSetup: count === 0 } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @POST /api/auth/register - creates the FIRST account only (one-time setup).
// Once any user exists this is permanently disabled, so it can't be used to
// create arbitrary accounts over the network later.
router.post('/register', async (req, res) => {
  try {
    const existingCount = await User.countDocuments();
    if (existingCount > 0) {
      return res.status(403).json({ success: false, message: 'Setup already completed. Ask an administrator to create additional accounts.' });
    }

    const { name, email, password, shopName } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const user = await User.create({ name, email, password, shopName, role: 'admin' });
    res.status(201).json({
      success: true,
      data: { _id: user._id, name: user.name, email: user.email, shopName: user.shopName, role: user.role },
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      res.json({
        success: true,
        data: { _id: user._id, name: user.name, email: user.email, shopName: user.shopName, role: user.role },
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  res.json({ success: true, data: req.user });
});

module.exports = router;
