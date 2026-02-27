
require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');

const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(express.json());
// Enable CORS for all origins
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.static('.', { extensions: ['html'] }));
app.use('/admin', express.static(path.join(__dirname, 'admin')));

const profileRoutes = require('./src/routes/profileRoutes');
const contactRoutes = require('./src/routes/contactRoutes');
const visaRoutes = require('./src/routes/visaRoutes');
const passportRoutes = require('./src/routes/passportRoutes');
const documentRoutes = require('./src/routes/documentRoutes');
const adminRoutes = require('./src/routes/adminRoutes');

// Routes
app.use('https://passport-ia5r.onrender.comhttps://passport-ia5r.onrender.com/api/auth', authRoutes);
app.use('https://passport-ia5r.onrender.comhttps://passport-ia5r.onrender.com/api/profile', profileRoutes);
app.use('https://passport-ia5r.onrender.comhttps://passport-ia5r.onrender.com/api/contact', contactRoutes);
app.use('https://passport-ia5r.onrender.comhttps://passport-ia5r.onrender.com/api/visa', visaRoutes);
app.use('https://passport-ia5r.onrender.comhttps://passport-ia5r.onrender.com/api/passport', passportRoutes);
app.use('https://passport-ia5r.onrender.comhttps://passport-ia5r.onrender.com/api/documents', documentRoutes);
app.use('https://passport-ia5r.onrender.comhttps://passport-ia5r.onrender.com/api/admin', adminRoutes);

app.use('/uploads', express.static('uploads'));

// Ensure /admin and /admin/ point to the admin panel
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

// Health Check
app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
