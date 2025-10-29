// routes/paymentRoutes.js
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const auth = require('../middleware/auth'); // ensure this path is correct
const PaymentDetail = require('../models/PaymentDetail');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const ext = file.originalname.split('.').pop();
    cb(null, `qr-${Date.now()}-${Math.round(Math.random()*1e9)}.${ext}`);
  }
});
const upload = multer({ storage });

// PUBLIC
router.get('/payment-details', async (req, res, next) => {
  try {
    const detail = await PaymentDetail.findOne().sort({ updatedAt: -1 });
    res.json(detail || {});
  } catch (err) { next(err); }
});

// ADMIN protected
router.get('/admin/payment-details', auth, async (req, res, next) => {
  try {
    const detail = await PaymentDetail.findOne().sort({ updatedAt: -1 });
    res.json(detail || {});
  } catch (err) { next(err); }
});

router.post('/admin/payment-details', auth, upload.single('qrImage'), async (req, res, next) => {
  try {
    const { accountName, accountNumber, ifsc, bank, upi, instructions } = req.body;
    let detail = await PaymentDetail.findOne().sort({ updatedAt: -1 });
    const qrPath = req.file ? req.file.path : undefined;

    if (detail) {
      if (qrPath && detail.qrImage && detail.qrImage.startsWith('uploads/')) {
        try { fs.unlinkSync(path.join(process.cwd(), detail.qrImage)); } catch (e) { console.warn('QR delete failed', e); }
      }
      detail.accountName = accountName ?? detail.accountName;
      detail.accountNumber = accountNumber ?? detail.accountNumber;
      detail.ifsc = ifsc ?? detail.ifsc;
      detail.bank = bank ?? detail.bank;
      detail.upi = upi ?? detail.upi;
      detail.instructions = instructions ?? detail.instructions;
      if (qrPath) detail.qrImage = qrPath;
      detail.updatedBy = req.admin?._id;
      await detail.save();
    } else {
      detail = new PaymentDetail({ accountName, accountNumber, ifsc, bank, upi, instructions, qrImage: qrPath, updatedBy: req.admin?._id });
      await detail.save();
    }

    res.json(detail);
  } catch (err) { next(err); }
});

module.exports = router;
