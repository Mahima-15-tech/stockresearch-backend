// models/Research.js
const mongoose = require('mongoose');

const ResearchSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  image: { type: String }, // path like 'uploads/xyz.jpg'
  file: { type: String },  // path like 'uploads/abc.pdf'
  addedAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, { timestamps: true });

module.exports = mongoose.model('Research', ResearchSchema);
