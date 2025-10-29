// routes/complaintsRoutes.js
const express = require('express');
const auth = require('../middleware/auth');
const Complaints = require('../models/Complaints');

const router = express.Router();

/**
 * GET /api/complaints
 * Public endpoint — returns the latest complaints document (most recent)
 */
router.get('/complaints', async (req, res, next) => {
  try {
    const doc = await Complaints.findOne().sort({ updatedAt: -1 });
    res.json(doc || {});
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/complaints
 * Admin-only view (protected)
 */
router.get('/admin/complaints', auth, async (req, res, next) => {
  try {
    const doc = await Complaints.findOne().sort({ updatedAt: -1 });
    res.json(doc || {});
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/complaints
 * Create or update the single complaints document.
 * Body: should contain fields: dateDisplayed (ISO string or date),
 * tableRows (array), monthlyTrend (array), yearlyTrend (array), annualAudit (array)
 *
 * Example payload (see below).
 */
router.post('/admin/complaints', auth, async (req, res, next) => {
  try {
    // Accept body as full payload. We'll upsert the single document.
    const payload = req.body || {};

    // Build update object only from allowed keys to avoid accidental fields
    const update = {};

    if (payload.dateDisplayed) update.dateDisplayed = new Date(payload.dateDisplayed);
    if (Array.isArray(payload.tableRows)) update.tableRows = payload.tableRows;
    if (Array.isArray(payload.monthlyTrend)) update.monthlyTrend = payload.monthlyTrend;
    if (Array.isArray(payload.yearlyTrend)) update.yearlyTrend = payload.yearlyTrend;
    if (Array.isArray(payload.annualAudit)) update.annualAudit = payload.annualAudit;

    update.updatedBy = req.admin._id;

    // findOneAndUpdate with upsert: true
    const doc = await Complaints.findOneAndUpdate(
      {},
      { $set: update },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json(doc);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
