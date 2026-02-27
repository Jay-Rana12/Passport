
require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const connectDB = require('./src/config/db');

// Route imports
const authRoutes = require('./src/routes/authRoutes');
const profileRoutes = require('./src/routes/profileRoutes');
const contactRoutes = require('./src/routes/contactRoutes');
const visaRoutes = require('./src/routes/visaRoutes');
const passportRoutes = require('./src/routes/passportRoutes');
const documentRoutes = require('./src/routes/documentRoutes');
const adminRoutes = require('./src/routes/adminRoutes');

const app = express();

// Connect to Database
connectDB();

// 1. JSON & CORS Middleware (MUST BE FIRST)
app.use(express.json());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Logging middleware to debug requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// 2. API Routes (MUST BE BEFORE STATIC FILES)
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/visa', visaRoutes);
app.use('/api/passport', passportRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/admin', adminRoutes);

// 3. Static files and Uploads
app.use('/uploads', express.static('uploads'));
app.use('/admin', express.static(path.join(__dirname, 'admin')));
app.use(express.static('.', { extensions: ['html'] }));

// Admin redirect
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

const mongoose = require('mongoose');

// Health Check
app.get('/', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
  res.json({
    status: 'Live',
    message: 'BorderBridge API is Running!',
    database: dbStatus
  });
});

// Network Debug Route
app.get('/api/debug-email-connection', async (req, res) => {
  const net = require('net');
  const s = new net.Socket();
  s.setTimeout(5000);
  s.on('timeout', () => { s.destroy(); res.json({ success: false, message: 'Timeout: Render is blocking smtp.googlemail.com:465' }); });
  s.on('error', (e) => { s.destroy(); res.json({ success: false, message: 'Error: ' + e.message }); });
  s.connect(465, 'smtp.googlemail.com', () => {
    s.destroy();
    res.json({ success: true, message: 'Success! Render can reach Google SMTP server' });
  });
});

// 404 Handler for API
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: `API Route ${req.originalUrl} not found` });
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
