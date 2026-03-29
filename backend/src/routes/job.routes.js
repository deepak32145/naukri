const express = require('express');
const router = express.Router();
const {
  createJob, getJobs, getRecommendedJobs, getMyJobs, getSavedJobs,
  getJobById, updateJob, deleteJob, updateJobStatus, saveJob, unsaveJob,
  toggleFeatured, getMatchScore, autocomplete,
} = require('../controllers/job.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

// Public routes — must come before /:id to avoid being swallowed
router.get('/', getJobs);
router.get('/autocomplete', autocomplete);

// Candidate routes
router.get('/candidate/recommended', protect, restrictTo('candidate'), getRecommendedJobs);
router.get('/candidate/saved', protect, restrictTo('candidate'), getSavedJobs);
router.post('/:id/save', protect, restrictTo('candidate'), saveJob);
router.delete('/:id/save', protect, restrictTo('candidate'), unsaveJob);
router.get('/:id/match', protect, restrictTo('candidate'), getMatchScore);

// Recruiter routes
router.get('/recruiter/my-jobs', protect, restrictTo('recruiter'), getMyJobs);
router.post('/', protect, restrictTo('recruiter'), createJob);
router.put('/:id', protect, restrictTo('recruiter'), updateJob);
router.delete('/:id', protect, restrictTo('recruiter'), deleteJob);
router.put('/:id/status', protect, restrictTo('recruiter'), updateJobStatus);
router.put('/:id/feature', protect, restrictTo('recruiter'), toggleFeatured);

// Must be last — catches /:id
router.get('/:id', protect, getJobById);

module.exports = router;
