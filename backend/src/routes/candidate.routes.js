const express = require('express');
const multer = require('multer');
const router = express.Router();
const {
  getProfile, updateProfile, uploadResume, deleteResume,
  getProfileViews, createJobAlert, getJobAlerts, deleteJobAlert, requestVerification,
  parseResumeUpload, importParsedProfile,
} = require('../controllers/candidate.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const { uploadResume: uploadResumeMw } = require('../config/cloudinary');

const memUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

router.use(protect, restrictTo('candidate'));

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/resume', uploadResumeMw.single('resume'), uploadResume);
router.delete('/resume', deleteResume);
router.post('/resume/parse', memUpload.single('resume'), parseResumeUpload);
router.post('/profile/import', importParsedProfile);
router.get('/profile-views', getProfileViews);
router.post('/verify', requestVerification);
router.post('/job-alerts', createJobAlert);
router.get('/job-alerts', getJobAlerts);
router.delete('/job-alerts/:alertId', deleteJobAlert);

module.exports = router;
