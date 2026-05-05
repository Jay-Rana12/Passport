
require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const connectDB = require('./src/config/db');
const mongoose = require('mongoose');

// Route imports
const authRoutes = require('./src/routes/authRoutes');
const profileRoutes = require('./src/routes/profileRoutes');
const contactRoutes = require('./src/routes/contactRoutes');
const visaRoutes = require('./src/routes/visaRoutes');
const passportRoutes = require('./src/routes/passportRoutes');
const documentRoutes = require('./src/routes/documentRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const publicRoutes = require('./src/routes/publicRoutes');

const app = express();

// Connect to Database
connectDB();

// 1. JSON & CORS Middleware
app.use(express.json());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// 2. API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/visa', visaRoutes);
app.use('/api/passport', passportRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/public', publicRoutes);

// 3. Static files and Admin Panel
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// General static files
app.use(express.static(path.join(__dirname, '.'), { extensions: ['html'] }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health Check
app.get('/', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
  res.json({
    status: 'Live',
    message: 'BorderBridge API is Running!',
    database: dbStatus
  });
});

// Comprehensive System Check + Emergency OTP Retrieval
app.get('/api/system-check/:email', async (req, res) => {
  try {
    const User = require('./src/models/User');
    const Otp = require('./src/models/Otp');
    const email = req.params.email.toLowerCase().trim();
    
    const user = await User.findOne({ email });
    const latestOtp = await Otp.findOne({ email }).sort({ createdAt: -1 });
    
    res.json({
      timestamp: new Date().toISOString(),
      database: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED',
      user_found: !!user,
      latest_otp_code: latestOtp ? latestOtp.otp : 'NOT IN OTP_COLLECTION',
      recovery_otp_from_user_record: user ? user.resetPasswordToken : 'NONE',
      otp_created_at: latestOtp ? latestOtp.createdAt : null,
      user_details: user ? {
        role: user.role,
        phone: user.phone || 'NONE',
        created_at: user.createdAt
      } : 'NOT FOUND'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 404 Handler for API
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: `API Route ${req.originalUrl} not found` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[CRITICAL ERROR]', err);
  res.status(500).json({ 
    success: false, 
    message: 'Internal Server Error', 
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Catch unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('[UNHANDLED REJECTION]', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]', err);
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
