const mongoose = require('mongoose');

const educationSchema = new mongoose.Schema({
  institution: { type: String, required: true },
  degree: { type: String, required: true },
  fieldOfStudy: { type: String },
  startYear: { type: Number },
  endYear: { type: Number },
  isCurrentlyStudying: { type: Boolean, default: false },
  grade: { type: String },
  description: { type: String },
});

const experienceSchema = new mongoose.Schema({
  company: { type: String, required: true },
  title: { type: String, required: true },
  location: { type: String },
  startDate: { type: Date },
  endDate: { type: Date },
  isCurrent: { type: Boolean, default: false },
  description: { type: String },
  skills: [{ type: String }],
});

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  url: { type: String },
  skills: [{ type: String }],
  startDate: { type: Date },
  endDate: { type: Date },
});

const certificationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  issuer: { type: String },
  issueDate: { type: Date },
  expiryDate: { type: Date },
  credentialId: { type: String },
  url: { type: String },
});

const jobAlertSchema = new mongoose.Schema({
  keyword: { type: String },
  location: { type: String },
  skills: [{ type: String }],
  minSalary: { type: Number },
  jobType: { type: String },
  frequency: { type: String, enum: ['daily', 'weekly'], default: 'daily' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const candidateProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  headline: { type: String, trim: true },
  summary: { type: String },
  skills: [{ type: String }],
  currentLocation: { type: String },
  preferredLocations: [{ type: String }],
  expectedSalary: { type: Number },
  currentSalary: { type: Number },
  experienceYears: { type: Number, default: 0 },
  noticePeriod: { type: String },
  resume: {
    url: { type: String, default: '' },
    publicId: { type: String, default: '' },
    name: { type: String, default: '' },
    uploadedAt: { type: Date },
  },
  education: [educationSchema],
  experience: [experienceSchema],
  projects: [projectSchema],
  certifications: [certificationSchema],
  languages: [{ language: String, proficiency: { type: String, enum: ['beginner', 'intermediate', 'proficient', 'native'] } }],
  profileViews: [{
    viewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    viewedAt: { type: Date, default: Date.now },
  }],
  completenessScore: { type: Number, default: 0 },
  jobAlerts: [jobAlertSchema],
  isOpenToWork: { type: Boolean, default: true },
  githubUrl: { type: String },
  linkedinUrl: { type: String },
  portfolioUrl: { type: String },
}, { timestamps: true });

// Calculate profile completeness
candidateProfileSchema.methods.calculateCompleteness = function () {
  let score = 0;
  if (this.headline) score += 10;
  if (this.summary) score += 10;
  if (this.skills && this.skills.length > 0) score += 15;
  if (this.resume && this.resume.url) score += 20;
  if (this.education && this.education.length > 0) score += 15;
  if (this.experience && this.experience.length > 0) score += 15;
  if (this.currentLocation) score += 5;
  if (this.certifications && this.certifications.length > 0) score += 5;
  if (this.projects && this.projects.length > 0) score += 5;
  this.completenessScore = score;
  return score;
};

module.exports = mongoose.model('CandidateProfile', candidateProfileSchema);
