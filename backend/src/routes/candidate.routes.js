const express = require('express');
const router = express.Router();
const {
  getProfile, updateProfile, uploadResume, deleteResume,
  getProfileViews, createJobAlert, getJobAlerts, deleteJobAlert,
} = require('../controllers/candidate.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const { uploadResume: uploadResumeMw } = require('../config/cloudinary');

router.use(protect, restrictTo('candidate'));

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/resume', uploadResumeMw.single('resume'), uploadResume);
router.delete('/resume', deleteResume);
router.get('/profile-views', getProfileViews);
router.post('/job-alerts', createJobAlert);
router.get('/job-alerts', getJobAlerts);
router.delete('/job-alerts/:alertId', deleteJobAlert);

module.exports = router;
