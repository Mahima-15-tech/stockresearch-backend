// routes/blogRoutes.js
const express = require('express');
const Blog = require('../models/Blog');
const router = express.Router();

// GET /api/blogs  -> list published blogs (paginated simple)
router.get('/blogs', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1'));
    const limit = Math.min(50, parseInt(req.query.limit || '12'));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Blog.find({ published: true }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Blog.countDocuments({ published: true })
    ]);

    res.json({ items, total, page, limit });
  } catch (err) { next(err); }
});

// GET /api/blogs/:slug  -> single blog by slug or id
router.get('/blogs/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;
    const blog = await Blog.findOne({ $or: [{ slug }, { _id: slug }] }).lean();
    if (!blog) return res.status(404).json({ message: 'Not found' });
    res.json(blog);
  } catch (err) { next(err); }
});

module.exports = router;
