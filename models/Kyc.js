const mongoose = require('mongoose');

const KycSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  fatherName: { type: String, required: true },
  mobile: { type: String, required: true },
  email: { type: String, required: true },
  address: { type: String, required: true },
  dob: { type: String, required: true },
  panNumber: { type: String, required: true },
  panFile: { type: String, required: true },
  aadharFront: { type: String, required: true },
  aadharBack: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Kyc', KycSchema);
