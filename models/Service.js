// models/Service.js
const mongoose = require('mongoose');

const PricingSchema = new mongoose.Schema({
  plan: { type: String },
  price: { type: String },
  gst: { type: String },
  total: { type: String },
  features: { type: [String], default: [] }
}, { _id: false });

const ServiceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // matches frontend id like "equity-growth"
  name: { type: String, required: true },
  tagline: { type: String, default: "" },
  overview: { type: String, default: "" },
  highlights: { type: [String], default: [] },
  pricing: { type: [PricingSchema], default: [] },
  image: { type: String }, // local path 'uploads/...' or full URL
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  active: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Service', ServiceSchema);
