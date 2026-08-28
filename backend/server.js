const fs = require('fs');
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// App version: read repo VERSION file, fall back to env, then 0.0.0
const APP_VERSION = (() => {
  try {
    return fs.readFileSync(path.join(__dirname, '..', 'VERSION'), 'utf8').trim();
  } catch (e) {
    return process.env.APP_VERSION || '0.0.0';
  }
})();

// Middleware
// CORS_ORIGIN blank -> reflect request origin (safe for a single-origin localhost deployment)
app.use(cors({ origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true }));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/billing', require('./routes/billing'));
app.use('/api/credit', require('./routes/credit'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Health check
app.get('/api/health', (req, res) => res.json({
  status: 'OK',
  message: 'Fertilizer Management System API',
  version: APP_VERSION,
  db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
}));

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/fertilizer_mgmt';

// Retry loop: in Docker the mongo container may not accept connections immediately
const connectWithRetry = (attempt = 1) => {
  mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => {
      const wait = Math.min(attempt * 2000, 10000);
      console.error(`❌ MongoDB connection error (attempt ${attempt}): ${err.message}. Retrying in ${wait / 1000}s`);
      setTimeout(() => connectWithRetry(attempt + 1), wait);
    });
};
connectWithRetry();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT} (v${APP_VERSION})`));
