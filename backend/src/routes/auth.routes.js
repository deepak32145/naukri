const express = require('express');
const router = express.Router();
const { register, login, logout, verifyEmail, resendOtp, forgotPassword, resetPassword } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', protect, logout);
router.post('/verify-email', protect, verifyEmail);
router.post('/resend-otp', protect, resendOtp);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
