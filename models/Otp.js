// models/Otp.js
const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  contact: { type: String, required: true }, // email stored here
  type: { type: String, enum: ['email'], default: 'email' }, // phone removed as twilio removed
  code: { type: String, required: true },
  verified: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Otp', otpSchema);
