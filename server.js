require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const errorHandler = require('./middleware/errorHandler');
const paymentRoutes = require('./routes/paymentRoutes');
const complaintsRoutes = require('./routes/complaintsRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const blogRoutes = require('./routes/blogRoutes');
const adminBlogRoutes = require('./routes/adminBlogRoutes');
const researchRoutes = require('./routes/researchRoutes');
const contactRoutes = require('./routes/contactRoutes');
const kycRoutes = require('./routes/kycRoutes');
const adminStats = require('./routes/adminStats');
const videoRoutes = require('./routes/videoRoutes');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5001;

// ensure uploads directory exists
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  console.log('Created uploads directory at', UPLOADS_DIR);
}

// allowed origins - update these to match your frontend
const allowedOrigins = [
  "https://investedgesolution.com",
  "https://www.investedgesolution.com",
  "http://localhost:5173",
  "http://localhost:3000"
];

// --- Manual CORS + preflight handler (robust for Render) ---
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin) {
    // allow server-to-server or curl requests
    res.header('Access-Control-Allow-Origin', '*');
  } else if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
  } else {
    // block unknown origins but still respond (optional)
    res.header('Access-Control-Allow-Origin', 'null');
  }

  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,Accept,X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// simple root route (choose one behavior)
// Option 1: API-only message
app.get('/', (req, res) => res.send('API is running. Use /api endpoints.'));

// // Option 2: redirect to frontend (uncomment if you want redirect)
// // app.get('/', (req, res) => res.redirect('https://investedgesolution.com'));

// static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', paymentRoutes);
app.use('/api', complaintsRoutes);
app.use('/api', serviceRoutes);
app.use('/api', blogRoutes);
app.use('/api/admin', adminBlogRoutes);
app.use('/api', researchRoutes);
app.use('/api', contactRoutes);
app.use('/api', kycRoutes);
app.use('/api', adminStats);
app.use('/api/videos', videoRoutes);

// health
app.get('/api/health', (req, res) => res.json({ ok: true }));

// error handler (keep at bottom)
app.use(errorHandler);

connectDB(process.env.MONGO_URI).then(() => {
  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} in use. Try changing PORT or kill the process using it.`);
      process.exit(1);
    } else {
      console.error(err);
    }
  });
}).catch(err => {
  console.error('Failed to connect DB or start server:', err);
  process.exit(1);
});
