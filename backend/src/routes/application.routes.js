const express = require('express');
const router = express.Router();
const {
  applyToJob, getMyApplications, getJobApplications,
  updateApplicationStatus, scheduleInterview, withdrawApplication,
  bulkUpdateStatus, getAnalytics,
} = require('../controllers/application.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

// Candidate routes
router.post('/jobs/:jobId/apply', protect, restrictTo('candidate'), applyToJob);
router.get('/my-applications', protect, restrictTo('candidate'), getMyApplications);
router.delete('/:id', protect, restrictTo('candidate'), withdrawApplication);

// Recruiter routes — specific paths before /:id
router.get('/analytics', protect, restrictTo('recruiter'), getAnalytics);
router.put('/bulk-status', protect, restrictTo('recruiter'), bulkUpdateStatus);
router.get('/jobs/:jobId/applications', protect, restrictTo('recruiter'), getJobApplications);
router.put('/:id/status', protect, restrictTo('recruiter'), updateApplicationStatus);
router.put('/:id/interview', protect, restrictTo('recruiter'), scheduleInterview);

module.exports = router;
