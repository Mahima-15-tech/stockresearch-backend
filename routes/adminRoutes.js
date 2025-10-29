const express = require('express');
const multer = require('multer');
// const Item = require('../models/Item');
const auth = require('../middleware/auth');

const router = express.Router();

// configure multer (local storage in uploads/)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const ext = file.originalname.split('.').pop();
    cb(null, Date.now() + '-' + Math.round(Math.random()*1e9) + '.' + ext);
  }
});
const upload = multer({ storage });

// Create item: POST /api/admin/items (protected)
router.post('/items', auth, upload.single('image'), async (req, res) => {
  try {
    const { title, description } = req.body;
    const item = new Item({
      title,
      description,
      image: req.file ? req.file.path : undefined,
      createdBy: req.admin._id
    });
    await item.save();
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Read items GET /api/admin/items
router.get('/items', auth, async (req, res) => {
  const items = await Item.find().sort({ createdAt: -1 });
  res.json(items);
});

// Update item PUT /api/admin/items/:id
router.put('/items/:id', auth, upload.single('image'), async (req, res) => {
  try {
    const data = { title: req.body.title, description: req.body.description };
    if(req.file) data.image = req.file.path;
    const updated = await Item.findByIdAndUpdate(req.params.id, data, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete item DELETE /api/admin/items/:id
router.delete('/items/:id', auth, async (req, res) => {
  try {
    await Item.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
