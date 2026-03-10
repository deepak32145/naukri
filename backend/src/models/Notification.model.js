const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['application_update', 'new_message', 'job_alert', 'profile_view', 'interview_scheduled', 'new_applicant'],
    required: true,
  },
  title: { type: String, required: true },
  body: { type: String, required: true },
  link: { type: String },
  isRead: { type: Boolean, default: false },
  relatedId: { type: mongoose.Schema.Types.ObjectId },
}, { timestamps: true });

notificationSchema.index({ userId: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
