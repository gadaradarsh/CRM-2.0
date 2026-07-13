const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const cors = require('cors');
require('dotenv').config();
const passport = require('./config/passport');

mongoose.set('strictQuery', true);

const authRoutes = require('./routes/auth');
const clientRoutes = require('./routes/clients');
const activityRoutes = require('./routes/activities');
const reportRoutes = require('./routes/reports');
const feedbackRoutes = require('./routes/feedback');
const taskRoutes = require('./routes/tasks');
const expenseRoutes = require('./routes/expenses');
const invoiceRoutes = require('./routes/invoices');

const app = express();
app.set('trust proxy', 1);

// CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'crm_dev_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  },
  name: 'crm.session'
}));

app.use(passport.initialize());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crmnew')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'CRM API is running',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV
  });
});

// Google OAuth callback
app.get('/login/oauth2/code/google',
  passport.authenticate('google', {
    failureRedirect: 'http://localhost:3000/login',
    session: false
  }),
  (req, res) => {
    if (req.user) {
      req.session.user = {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      };
    }
    res.redirect('http://localhost:3000/');
  }
);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api', expenseRoutes);
app.use('/api', invoiceRoutes);

// Global error handler
app.use((err, req, res, next) => {
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) console.error('🔥 Server Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Something went wrong!',
    ...(isDev && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

module.exports = app;
