
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

// Middleware
app.use(express.json());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/visa', visaRoutes);
app.use('/api/passport', passportRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/admin', adminRoutes);

// Static files
app.use(express.static('.', { extensions: ['html'] }));
app.use('/admin', express.static(path.join(__dirname, 'admin')));
app.use('/uploads', express.static('uploads'));

// Admin redirect
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

// Health Check
app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
