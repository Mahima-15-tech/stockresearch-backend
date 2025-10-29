const express = require('express');
const Contact = require('../models/Contact');
const auth = require('../middleware/auth'); // use your existing admin auth
const router = express.Router();

// public: submit contact
router.post('/contact', async (req, res, next) => {
  try {
    const { name, email, phone, message } = req.body || {};
    if (!name || !email) return res.status(400).json({ message: 'name & email required' });

    const c = new Contact({
      name: String(name).trim(),
      email: String(email).trim(),
      phone: phone ? String(phone).trim() : '',
      message: message ? String(message).trim() : '',
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('User-Agent') || ''
    });

    await c.save();

    // optional: send admin notification email here via nodemailer (if you want)
    res.status(201).json({ message: 'Thanks — we received your message', contact: c });
  } catch (err) { next(err); }
});

// admin: list contacts (protected)
router.get('/admin/contacts', auth, async (req, res, next) => {
  try {
    const items = await Contact.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) { next(err); }
});

// admin: get single
router.get('/admin/contacts/:id', auth, async (req, res, next) => {
  try {
    const item = await Contact.findById(req.params.id);
    if(!item) return res.status(404).json({ message: 'Not found' });
    res.json(item);
  } catch (err) { next(err); }
});

// admin: delete
router.delete('/admin/contacts/:id', auth, async (req, res, next) => {
  try {
    await Contact.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
