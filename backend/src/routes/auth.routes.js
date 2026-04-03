const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const { register, login, logout, verifyEmail, resendOtp, forgotPassword, resetPassword, googleCallback } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', protect, logout);
router.post('/verify-email', protect, verifyEmail);
router.post('/resend-otp', protect, resendOtp);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Google OAuth
router.get('/google', (req, res) => {
  const role = req.query.state || 'candidate';
  passport.authenticate('google', { scope: ['profile', 'email'], state: role })(req, res);
});
router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login` }), googleCallback);

module.exports = router;
