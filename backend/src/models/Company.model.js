const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  logo: {
    url: { type: String, default: '' },
    publicId: { type: String, default: '' },
  },
  description: { type: String },
  industry: { type: String },
  size: { type: String, enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+'] },
  website: { type: String },
  location: { type: String },
  founded: { type: Number },
  linkedIn: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isVerified: { type: Boolean, default: false },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  jobsCount: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Company', companySchema);
