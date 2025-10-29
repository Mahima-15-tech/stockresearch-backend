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
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
const adminStats = require("./routes/adminStats");
const videoRoutes = require("./routes/videoRoutes");


const app = express();
const PORT = process.env.PORT || 5001;

const fs = require('fs');


// ensure uploads directory exists
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  console.log('Created uploads directory at', UPLOADS_DIR);
}


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.use("/api", adminStats);  
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use("/api/videos", videoRoutes);

// health
app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use(errorHandler);

connectDB(process.env.MONGO_URI).then(() => {
  // graceful port check to avoid EADDRINUSE crash
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
});
