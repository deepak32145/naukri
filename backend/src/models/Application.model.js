const mongoose = require('mongoose');

const timelineSchema = new mongoose.Schema({
  status: { type: String },
  note: { type: String },
  updatedAt: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

const applicationSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  coverLetter: { type: String },
  resume: {
    url: { type: String },
    name: { type: String },
  },
  status: {
    type: String,
    enum: ['applied', 'under_review', 'shortlisted', 'interview_scheduled', 'rejected', 'hired'],
    default: 'applied',
  },
  interviewDetails: {
    date: { type: Date },
    time: { type: String },
    mode: { type: String, enum: ['online', 'offline', 'phone'] },
    link: { type: String },
    notes: { type: String },
  },
  timeline: [timelineSchema],
  recruiterNotes: { type: String },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

applicationSchema.index({ jobId: 1, candidateId: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
