// models/PaymentDetail.js
const mongoose = require('mongoose');

const PaymentDetailSchema = new mongoose.Schema({
  accountName: { type: String, default: 'Investedge Solution' },
  accountNumber: { type: String },
  ifsc: { type: String },
  bank: { type: String },
  upi: { type: String },
  instructions: { type: String, default: '' },
  qrImage: { type: String }, // local path or url
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, { timestamps: true });

module.exports = mongoose.model('PaymentDetail', PaymentDetailSchema);
