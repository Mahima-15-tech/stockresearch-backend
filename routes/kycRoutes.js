const express = require('express');
const multer = require('multer');
const path = require('path');
const Kyc = require('../models/Kyc');
const auth = require('../middleware/auth'); // for admin routes

const router = express.Router();

// Upload setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/kyc'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + Date.now() + ext);
  }
});
const upload = multer({ storage });

// PUBLIC: Submit KYC
router.post('/kyc', upload.fields([
  { name: 'panFile', maxCount: 1 },
  { name: 'aadharFront', maxCount: 1 },
  { name: 'aadharBack', maxCount: 1 }
]), async (req, res) => {
  try {
    const {
      fullName, fatherName, mobile, email, address, dob, panNumber
    } = req.body;
    if (!fullName || !fatherName || !mobile || !email || !address || !dob || !panNumber)
      return res.status(400).json({ message: 'All fields required' });

    const panFile = req.files?.panFile?.[0]?.path;
    const aadharFront = req.files?.aadharFront?.[0]?.path;
    const aadharBack = req.files?.aadharBack?.[0]?.path;

    if (!panFile || !aadharFront || !aadharBack)
      return res.status(400).json({ message: 'All files required' });

    const kyc = new Kyc({
      fullName, fatherName, mobile, email, address, dob, panNumber,
      panFile, aadharFront, aadharBack
    });
    await kyc.save();
    res.json({ message: 'KYC submitted successfully', kyc });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ADMIN: Get all KYCs
router.get('/admin/kyc', auth, async (req, res) => {
  try {
    const kycs = await Kyc.find().sort({ createdAt: -1 });
    res.json(kycs);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
