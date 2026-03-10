const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, required: true },
  pros: { type: String },
  cons: { type: String },
  isAnonymous: { type: Boolean, default: false },
}, { timestamps: true });

reviewSchema.index({ companyId: 1, candidateId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
