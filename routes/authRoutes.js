const express = require('express');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    if(!admin) return res.status(401).json({ message: 'Invalid credentials' });
    const isMatch = await admin.comparePassword(password);
    if(!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: admin._id, email: admin.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, admin: { id: admin._id, email: admin.email, name: admin.name } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/auth/me  (protected)
const auth = require('../middleware/auth');
router.get('/me', auth, async (req, res, next) => {
  try {
    // req.admin is set by auth middleware (without password)
    res.json(req.admin);
  } catch (err) { next(err); }
});


module.exports = router;
