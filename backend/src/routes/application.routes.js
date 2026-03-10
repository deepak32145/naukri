const express = require('express');
const router = express.Router();
const {
  applyToJob, getMyApplications, getJobApplications,
  updateApplicationStatus, scheduleInterview, withdrawApplication,
} = require('../controllers/application.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

router.post('/jobs/:jobId/apply', protect, restrictTo('candidate'), applyToJob);
router.get('/my-applications', protect, restrictTo('candidate'), getMyApplications);
router.delete('/:id', protect, restrictTo('candidate'), withdrawApplication);

router.get('/jobs/:jobId/applications', protect, restrictTo('recruiter'), getJobApplications);
router.put('/:id/status', protect, restrictTo('recruiter'), updateApplicationStatus);
router.put('/:id/interview', protect, restrictTo('recruiter'), scheduleInterview);

module.exports = router;
