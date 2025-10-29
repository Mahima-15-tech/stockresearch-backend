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


const allowedOrigins = [
  "https://investedgesolution.com",      // your production frontend domain
  "https://www.investedgesolution.com",  // if you use www
  "http://localhost:5173",               // local dev Vite default (optional)
  "http://localhost:3000"                // local CRA dev (optional)
];

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like server-to-server or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    return callback(new Error("CORS policy: This origin is not allowed: " + origin));
  },
  credentials: true, // if you use cookies or auth headers
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization","Accept","X-Requested-With"]
}));

// Make sure preflight OPTIONS are handled
app.options("*", cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// simple root route
app.get('/', (req, res) => {
  res.send('API is running. Use /api endpoints.');
});

app.get('/', (req, res) => {
  res.redirect('https://investedgesolution.com'); // tumhara frontend URL
});


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
