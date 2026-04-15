require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const errorHandler = require('./middleware/error.middleware');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const candidateRoutes = require('./routes/candidate.routes');
const companyRoutes = require('./routes/company.routes');
const jobRoutes = require('./routes/job.routes');
const applicationRoutes = require('./routes/application.routes');
const chatRoutes = require('./routes/chat.routes');
const notificationRoutes = require('./routes/notification.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

// cors must come before helmet so its headers are never overridden
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// Rate limiting — skip in test env to avoid false 429s
if (process.env.NODE_ENV !== 'test') {
  const rateLimit = require('express-rate-limit');
  
  // Higher limit for user profile endpoint
  app.use('/api/users/me', rateLimit({ 
    windowMs: 15 * 60 * 1000, 
    max: 1000, // Allow up to 1000 requests per 15 minutes for /api/users/me
    message: 'Too many requests to user profile endpoint'
  }));
  
  // Global rate limit
  app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }));
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global multer — parses multipart/form-data for every route that doesn't
// already have its own multer middleware (those routes own their stream).
const multer = require('multer');
const _globalUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
}).any();
const MULTER_OWNED_ROUTES = [
  '/api/users/me/avatar',
  '/api/candidate/resume',     // Cloudinary upload + memory parse
  '/api/companies',            // logo upload (dynamic :id segment)
];
app.use((req, res, next) => {
  const skip = MULTER_OWNED_ROUTES.some((p) => req.path.startsWith(p));
  if (skip) return next();
  _globalUpload(req, res, next);
});

// Passport
const passport = require('./config/passport');
app.use(passport.initialize());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/candidate', candidateRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` }));
app.use(errorHandler);

module.exports = app;
