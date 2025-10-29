// models/Blog.js
const mongoose = require('mongoose');

const BlogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true }, // friendly id for URL
  excerpt: { type: String, default: '' },
  content: { type: String, default: '' }, // store markdown or plain text
  image: { type: String, default: '' }, // uploads path or external url
  published: { type: Boolean, default: true },
  author: { type: String, default: 'Investedge Solution' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, { timestamps: true });

module.exports = mongoose.model('Blog', BlogSchema);
