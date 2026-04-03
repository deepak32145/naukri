const User = require('../models/User.model');
const CandidateProfile = require('../models/CandidateProfile.model');
const { generateToken, generateOTP } = require('../utils/generateToken');
const { queueEmail, emailTemplates } = require('../utils/email');

// @POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'All fields required' });
    }
    if (!['candidate', 'recruiter'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role must be candidate or recruiter' });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    const user = await User.create({
      name, email, password, role, phone,
      otp: { code: otp, expiresAt: otpExpiry, type: 'email_verification' },
    });

    if (role === 'candidate') {
      await CandidateProfile.create({ userId: user._id });
    }

    const tpl = emailTemplates.verifyEmail(name, otp);
    await queueEmail({ to: email, ...tpl });

    const token = generateToken(user._id);
    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your email.',
      token,
      user: { _id: user._id, name, email, role, isEmailVerified: false },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @POST /api/auth/verify-email
const verifyEmail = async (req, res) => {
  try {
    const { otp } = req.body;
    const user = await User.findById(req.user._id).select('+otp');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const fullUser = await User.findById(req.user._id);
    const rawUser = await User.findById(req.user._id).lean();

    // Access otp directly from DB
    const dbUser = await User.findById(req.user._id);
    // Use aggregate to get otp field
    const userWithOtp = await User.collection.findOne({ _id: user._id });

    if (!userWithOtp.otp || userWithOtp.otp.type !== 'email_verification') {
      return res.status(400).json({ success: false, message: 'No verification OTP found' });
    }
    if (userWithOtp.otp.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP expired' });
    }
    if (userWithOtp.otp.code !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
    await User.findByIdAndUpdate(user._id, {
      isEmailVerified: true,
      $unset: { otp: 1 },
    });
    res.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @POST /api/auth/resend-otp
const resendOtp = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user.isEmailVerified) {
      return res.status(400).json({ success: false, message: 'Email already verified' });
    }
    const otp = generateOTP();
    await User.findByIdAndUpdate(user._id, {
      otp: { code: otp, expiresAt: new Date(Date.now() + 10 * 60 * 1000), type: 'email_verification' },
    });
    const tpl = emailTemplates.verifyEmail(user.name, otp);
    await queueEmail({ to: user.email, ...tpl });
    res.json({ success: true, message: 'OTP resent to your email' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    if (user.isBanned) return res.status(403).json({ success: false, message: 'Account banned. Contact support.' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    await User.findByIdAndUpdate(user._id, { lastSeen: new Date() });
    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @POST /api/auth/logout
const logout = async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { lastSeen: new Date() });
  res.json({ success: true, message: 'Logged out successfully' });
};

// @POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'No account with this email' });

    const otp = generateOTP();
    await User.findByIdAndUpdate(user._id, {
      otp: { code: otp, expiresAt: new Date(Date.now() + 10 * 60 * 1000), type: 'password_reset' },
    });
    const tpl = emailTemplates.passwordReset(user.name, otp);
    await queueEmail({ to: email, ...tpl });
    res.json({ success: true, message: 'Password reset OTP sent to your email' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const userWithOtp = await User.collection.findOne({ email });
    if (!userWithOtp) return res.status(404).json({ success: false, message: 'User not found' });
    if (!userWithOtp.otp || userWithOtp.otp.type !== 'password_reset') {
      return res.status(400).json({ success: false, message: 'No reset OTP found' });
    }
    if (userWithOtp.otp.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP expired' });
    }
    if (userWithOtp.otp.code !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
    const user = await User.findOne({ email });
    user.password = newPassword;
    await user.save();
    await User.findByIdAndUpdate(user._id, { $unset: { otp: 1 } });
    res.json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const googleCallback = async (req, res) => {
  try {
    const token = generateToken(req.user._id);
    // Redirect to frontend with token
    const redirectUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/auth/callback?token=${token}`;
    res.redirect(redirectUrl);
  } catch (error) {
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=auth_failed`);
  }
};

module.exports = { register, login, logout, verifyEmail, resendOtp, forgotPassword, resetPassword, googleCallback };
