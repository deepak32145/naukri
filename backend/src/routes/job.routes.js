const express = require('express');
const router = express.Router();
const {
  createJob, getJobs, getRecommendedJobs, getMyJobs, getSavedJobs,
  getJobById, updateJob, deleteJob, updateJobStatus, saveJob, unsaveJob,
} = require('../controllers/job.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

// Public routes
router.get('/', getJobs);
router.get('/:id', protect, getJobById); // protect optional for view tracking

// Candidate routes
router.get('/candidate/recommended', protect, restrictTo('candidate'), getRecommendedJobs);
router.get('/candidate/saved', protect, restrictTo('candidate'), getSavedJobs);
router.post('/:id/save', protect, restrictTo('candidate'), saveJob);
router.delete('/:id/save', protect, restrictTo('candidate'), unsaveJob);

// Recruiter routes
router.get('/recruiter/my-jobs', protect, restrictTo('recruiter'), getMyJobs);
router.post('/', protect, restrictTo('recruiter'), createJob);
router.put('/:id', protect, restrictTo('recruiter'), updateJob);
router.delete('/:id', protect, restrictTo('recruiter'), deleteJob);
router.put('/:id/status', protect, restrictTo('recruiter'), updateJobStatus);

module.exports = router;
