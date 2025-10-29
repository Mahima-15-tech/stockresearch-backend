// models/ResearchSubmission.js
const mongoose = require('mongoose');

const ResearchSubmissionSchema = new mongoose.Schema({
  research: { type: mongoose.Schema.Types.ObjectId, ref: 'Research', required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  otp: { type: String },            // store OTP hashed/plain for demo (we'll use plain for now)
  otpExpires: { type: Date },
  verifiedAt: { type: Date },
  downloadedAt: { type: Date },
  ip: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('ResearchSubmission', ResearchSubmissionSchema);
