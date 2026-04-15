const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: function() { return !this.isOAuth; }, minlength: 6 },
  role: { type: String, enum: ['candidate', 'recruiter', 'admin'], default: 'candidate' },
  phone: { type: String, trim: true },
  avatar: {
    url: { type: String, default: '' },
    publicId: { type: String, default: '' },
  },
  isEmailVerified: { type: Boolean, default: false },
  isOAuth: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  isBanned: { type: Boolean, default: false },
  otp: {
    code: { type: String },
    expiresAt: { type: Date },
    type: { type: String, enum: ['email_verification', 'password_reset', 'login_otp'] },
  },
  lastSeen: { type: Date, default: Date.now },
}, { timestamps: true });

userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.otp;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
