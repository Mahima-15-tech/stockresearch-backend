// routes/researchRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Research = require('../models/Research');
const Submission = require('../models/ResearchSubmission');
const Otp = require('../models/Otp');
const auth = require('../middleware/auth'); // admin auth for admin endpoints
// replace nodemailer with sendgrid
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// helper to send OTP email via SendGrid
async function sendOtpEmail(toEmail, code) {
  const msg = {
    to: toEmail,
    from: process.env.SMTP_FROM || 'noreply@investedgesolution.com',
    subject: 'Your OTP Code',
    html: `
      <div style="font-family:Arial,sans-serif;padding:20px;background:#f8f8f8;">
        <h2 style="color:#333;">Your OTP Code</h2>
        <p style="font-size:16px;">Your one-time password (OTP) is:</p>
        <div style="font-size:28px;font-weight:bold;background:#e0ffe0;padding:10px;text-align:center;border-radius:8px;color:#2b6d2b;">
          ${code}
        </div>
        <p style="margin-top:10px;">This OTP will expire in 5 minutes.</p>
      </div>
    `,
  };

  return sgMail.send(msg);
}

  
const router = express.Router();

// multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const ext = file.originalname.split('.').pop();
    cb(null, `${file.fieldname}-${Date.now()}-${Math.round(Math.random()*1e9)}.${ext}`);
  }
});
const upload = multer({ storage });

// PUBLIC: list research (basic fields)
router.get('/research', async (req, res, next) => {
  try {
    const items = await Research.find().sort({ addedAt: -1 });
    res.json(items);
  } catch (err) { next(err); }
});

// PUBLIC: get single research by id/slug
router.get('/research/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const q = mongooseIsObjectId(id) ? { _id: id } : { slug: id };
    const item = await Research.findOne(q);
    if(!item) return res.status(404).json({ message: 'Not found' });
    res.json(item);
  } catch (err) { next(err); }
});

// Admin: create research (image + file)
router.post('/admin/research', auth, upload.fields([{ name: 'image' }, { name: 'file' }]), async (req, res, next) => {
  try {
    const { title, slug, description } = req.body;
    const image = req.files?.image?.[0]?.path;
    const file = req.files?.file?.[0]?.path;
    if(!title || !slug) return res.status(400).json({ message: 'title & slug required' });
    const r = new Research({ title, slug, description, image, file });
    await r.save();
    res.json(r);
  } catch (err) { next(err); }
});

// Admin: update
router.put('/admin/research/:id', auth, upload.fields([{ name: 'image' }, { name: 'file' }]), async (req, res, next) => {
  try {
    const id = req.params.id;
    const r = await Research.findById(id);
    if(!r) return res.status(404).json({ message: 'Not found' });
    const { title, slug, description } = req.body;
    if (title) r.title = title;
    if (slug) r.slug = slug;
    if (description) r.description = description;
    if (req.files?.image?.[0]) {
      // delete old if local
      if (r.image && r.image.startsWith('uploads/')) safeUnlink(r.image);
      r.image = req.files.image[0].path;
    }
    if (req.files?.file?.[0]) {
      if (r.file && r.file.startsWith('uploads/')) safeUnlink(r.file);
      r.file = req.files.file[0].path;
    }
    await r.save();
    res.json(r);
  } catch (err) { next(err); }
});

// Admin: delete
router.delete('/admin/research/:id', auth, async (req, res, next) => {
  try {
    const r = await Research.findByIdAndDelete(req.params.id);
    if(r) {
      if (r.image && r.image.startsWith('uploads/')) safeUnlink(r.image);
      if (r.file && r.file.startsWith('uploads/')) safeUnlink(r.file);
    }
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// PUBLIC: send OTP to phone (rate-limit & reuse allowed)
// --- START replace OTP & submit handlers (email-only) ---

// PUBLIC: send OTP to email (email required)
// PUBLIC: send OTP to email (email required)
router.post("/research/send-otp", async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "email required" });

    // quick env guard
    if (!process.env.SENDGRID_API_KEY) {
      console.error("SendGrid API key missing in env");
      return res.status(500).json({ message: "Email service not configured" });
    }
    if (!process.env.SMTP_FROM) {
      console.error("SMTP_FROM missing in env");
      return res.status(500).json({ message: "Email sender not configured" });
    }

    // generate 6-digit otp
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // store in DB (contact=email, type=email)
    await Otp.create({ contact: email, type: "email", code, expiresAt, verified: false });

    // send email via SendGrid helper
    try {
      await sendOtpEmail(email, code);
      console.log(`✅ OTP sent to ${email}: ${code}`);
      return res.json({ message: "OTP sent to your email" });
    } catch (sendErr) {
      // log helpful SendGrid response body when available
      console.error("send-otp sendgrid error:", sendErr);
      console.error("send-otp sendgrid response body:", sendErr?.response?.body || sendErr?.message || sendErr);
      return res.status(502).json({ message: "Failed to send OTP email" });
    }

  } catch (err) {
    console.error("send-otp error:", err);
    return next(err);
  }
});

  
  // PUBLIC: verify OTP (email)
  router.post("/research/verify-otp", async (req, res, next) => {
    try {
      const { email, code } = req.body;
      if (!email || !code) return res.status(400).json({ message: "email & code required" });
  
      const otpDoc = await Otp.findOne({ contact: email, code, verified: false }).sort({ createdAt: -1 });
      if (!otpDoc) return res.status(400).json({ message: "Invalid OTP" });
      if (otpDoc.expiresAt < new Date()) return res.status(400).json({ message: "OTP expired" });
  
      otpDoc.verified = true;
      await otpDoc.save();
      res.json({ message: "verified" });
    } catch (err) {
      console.error("verify-otp error:", err);
      next(err);
    }
  });
  
  // PUBLIC: submit form + trigger download if OTP verified (email)
  router.post('/research/submit', async (req, res, next) => {
    try {
      const { researchId, name, email, phone } = req.body;
      if(!researchId || !name || !email) return res.status(400).json({ message: 'researchId, name and email required' });
  
      const r = await Research.findById(researchId);
      if(!r) return res.status(404).json({ message: 'Research not found' });
  
      // verify OTP was issued and verified for this contact (we're using email OTP)
      const otp = await Otp.findOne({ contact: email, verified: true }).sort({ createdAt: -1 });
      if(!otp) return res.status(400).json({ message: 'Email not verified' });
  
      const sub = new Submission({
        research: r._id,
        name,
        email,
        phone: phone || undefined,
        verifiedAt: new Date(),
        downloadedAt: new Date(),
        ip: req.ip
      });
      await sub.save();
  
      const fileUrl = r.file && r.file.startsWith('http') ? r.file : `${req.protocol}://${req.get('host')}/${r.file}`;
      res.json({ message: 'ok', downloadUrl: fileUrl, submission: sub });
    } catch (err) { next(err); }
  });
  
  // --- END replace OTP & submit handlers ---
  

// ADMIN: list submissions
router.get('/admin/research/submissions', auth, async (req, res, next) => {
  try {
    const subs = await Submission.find().populate('research').sort({ createdAt: -1 });
    res.json(subs);
  } catch (err) { next(err); }
});

function safeUnlink(p) {
  try { fs.unlinkSync(path.join(process.cwd(), p)); } catch (e) { console.warn('unlink failed', e); }
}

function mongooseIsObjectId(v) {
  const mongoose = require('mongoose');
  return mongoose.Types.ObjectId.isValid(v);
}

module.exports = router;
