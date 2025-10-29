// routes/serviceRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth'); // admin auth middleware
const Service = require('../models/Service');

const router = express.Router();

// multer storage (ensure uploads dir exists)
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = file.originalname.split('.').pop();
    cb(null, `service-${Date.now()}-${Math.round(Math.random()*1e9)}.${ext}`);
  }
});
const upload = multer({ storage });

// PUBLIC: list all active services
router.get('/services', async (req, res, next) => {
  try {
    const list = await Service.find({}).sort({ createdAt: 1 });
    res.json(list);
  } catch (err) { next(err); }
});

// PUBLIC: get one service by id (frontend may use)
router.get('/services/:id', async (req, res, next) => {
  try {
    const svc = await Service.findOne({ id: req.params.id });
    if (!svc) return res.status(404).json({ message: 'Not found' });
    res.json(svc);
  } catch (err) { next(err); }
});

// ADMIN: create new service (multipart to allow image)
router.post('/admin/services', auth, upload.single('image'), async (req, res, next) => {
  try {
    const body = req.body || {};
    // parse pricing & highlights if sent as JSON strings (from forms)
    if (typeof body.pricing === 'string') {
      try { body.pricing = JSON.parse(body.pricing); } catch(e){ body.pricing = []; }
    }
    if (typeof body.highlights === 'string') {
      try { body.highlights = JSON.parse(body.highlights); } catch(e){ body.highlights = []; }
    }

    // ensure required fields
    if (!body.id || !body.name) return res.status(400).json({ message: 'id and name required' });

    const exists = await Service.findOne({ id: body.id });
    if (exists) return res.status(409).json({ message: 'Service with this id already exists' });

    const svc = new Service({
      id: body.id,
      name: body.name,
      tagline: body.tagline || "",
      overview: body.overview || "",
      highlights: Array.isArray(body.highlights) ? body.highlights : [],
      pricing: Array.isArray(body.pricing) ? body.pricing : [],
      image: req.file ? path.relative(process.cwd(), req.file.path).replace(/\\\\/g, '/') : body.image,
      createdBy: req.admin._id,
      updatedBy: req.admin._id
    });

    await svc.save();
    res.status(201).json(svc);
  } catch (err) { next(err); }
});

// ADMIN: update service by Mongo _id or by service id (prefer by id)
router.put('/admin/services/:id', auth, upload.single('image'), async (req, res, next) => {
  try {
    const idParam = req.params.id;
    const body = req.body || {};
    if (typeof body.pricing === 'string') {
      try { body.pricing = JSON.parse(body.pricing); } catch(e){ body.pricing = []; }
    }
    if (typeof body.highlights === 'string') {
      try { body.highlights = JSON.parse(body.highlights); } catch(e){ body.highlights = []; }
    }

    const svc = await Service.findOne({ id: idParam });
    if (!svc) return res.status(404).json({ message: 'Not found' });

    // if replacing image, delete old local file
    if (req.file && svc.image && svc.image.startsWith('uploads/')) {
      try { fs.unlinkSync(path.join(process.cwd(), svc.image)); } catch (e) { console.warn('old service image delete failed', e); }
    }

    svc.name = body.name ?? svc.name;
    svc.tagline = body.tagline ?? svc.tagline;
    svc.overview = body.overview ?? svc.overview;
    svc.highlights = Array.isArray(body.highlights) ? body.highlights : svc.highlights;
    svc.pricing = Array.isArray(body.pricing) ? body.pricing : svc.pricing;
    if (req.file) svc.image = path.relative(process.cwd(), req.file.path).replace(/\\\\/g, '/');
    svc.active = (typeof body.active !== 'undefined') ? Boolean(body.active) : svc.active;
    svc.updatedBy = req.admin._id;

    await svc.save();
    res.json(svc);
  } catch (err) { next(err); }
});

// ADMIN: delete service
router.delete('/admin/services/:id', auth, async (req, res, next) => {
  try {
    const svc = await Service.findOne({ id: req.params.id });
    if (!svc) return res.status(404).json({ message: 'Not found' });
    // delete local image if any
    if (svc.image && svc.image.startsWith('uploads/')) {
      try { fs.unlinkSync(path.join(process.cwd(), svc.image)); } catch (e) { console.warn('service image delete failed', e); }
    }
    await Service.deleteOne({ _id: svc._id });
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
