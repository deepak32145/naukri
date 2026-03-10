const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  requirements: { type: String },
  skills: [{ type: String }],
  salaryMin: { type: Number },
  salaryMax: { type: Number },
  location: { type: String, required: true },
  isRemote: { type: Boolean, default: false },
  jobType: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'internship', 'freelance'],
    default: 'full-time',
  },
  experienceMin: { type: Number, default: 0 },
  experienceMax: { type: Number, default: 30 },
  industry: { type: String },
  openings: { type: Number, default: 1 },
  status: {
    type: String,
    enum: ['active', 'paused', 'closed', 'draft'],
    default: 'active',
  },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  applicationsCount: { type: Number, default: 0 },
  viewsCount: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false },
  deadline: { type: Date },
  savedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

jobSchema.index({ title: 'text', description: 'text', skills: 'text' });
jobSchema.index({ location: 1, jobType: 1, status: 1 });

module.exports = mongoose.model('Job', jobSchema);
