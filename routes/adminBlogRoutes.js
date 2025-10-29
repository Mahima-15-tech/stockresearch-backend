// routes/adminBlogRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Blog = require('../models/Blog');
const auth = require('../middleware/auth');

const router = express.Router();

// multer storage (same pattern)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = file.originalname.split('.').pop();
    cb(null, `blog-${Date.now()}-${Math.round(Math.random()*1e9)}.${ext}`);
  }
});
const upload = multer({ storage });

// GET /api/admin/blogs  -> list all (admin)
router.get('/blogs', auth, async (req, res, next) => {
  try {
    const items = await Blog.find().sort({ createdAt: -1 }).lean();
    res.json(items);
  } catch (err) { next(err); }
});

// POST /api/admin/blogs  -> create (multipart)
router.post('/blogs', auth, upload.single('image'), async (req, res, next) => {
  try {
    const { title, slug, excerpt, content, published = 'true', author } = req.body;
    if (!title || !slug) return res.status(400).json({ message: 'title and slug required' });

    const imagePath = req.file ? req.file.path : (req.body.image || '');

    const blog = new Blog({
      title,
      slug,
      excerpt: excerpt || '',
      content: content || '',
      image: imagePath,
      published: published === 'true' || published === true,
      author: author || 'Investedge Solution',
      createdBy: req.admin._id,
      updatedBy: req.admin._id
    });

    await blog.save();
    res.json(blog);
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/blogs/:id  -> update
router.put('/blogs/:id', auth, upload.single('image'), async (req, res, next) => {
  try {
    const id = req.params.id;
    const b = await Blog.findById(id);
    if (!b) return res.status(404).json({ message: 'Not found' });

    const { title, slug, excerpt, content, published, author } = req.body;

    // handle image replacement
    if (req.file) {
      // delete old if local
      if (b.image && b.image.startsWith('uploads/')) {
        try { fs.unlinkSync(path.join(process.cwd(), b.image)); } catch (e) { console.warn('delete failed', e); }
      }
      b.image = req.file.path;
    } else if (typeof req.body.image !== 'undefined') {
      b.image = req.body.image; // allow setting external URL or empty
    }

    if (title) b.title = title;
    if (slug) b.slug = slug;
    if (typeof excerpt !== 'undefined') b.excerpt = excerpt;
    if (typeof content !== 'undefined') b.content = content;
    if (typeof published !== 'undefined') b.published = (published === 'true' || published === true);
    if (typeof author !== 'undefined') b.author = author;

    b.updatedBy = req.admin._id;
    await b.save();
    res.json(b);
  } catch (err) { next(err); }
});

// DELETE /api/admin/blogs/:id
router.delete('/blogs/:id', auth, async (req, res, next) => {
  try {
    const b = await Blog.findById(req.params.id);
    if (!b) return res.status(404).json({ message: 'Not found' });

    // delete image file if stored locally
    if (b.image && b.image.startsWith('uploads/')) {
      try { fs.unlinkSync(path.join(process.cwd(), b.image)); } catch (e) { console.warn('delete failed', e); }
    }

    await Blog.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
