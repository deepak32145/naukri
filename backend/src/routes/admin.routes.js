const express = require('express');
const router = express.Router();
const { getStats, getAllUsers, banUser, getAllJobs, deleteJob, verifyCompany, verifyCandidate, getPendingVerifications } = require('../controllers/admin.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

router.use(protect, restrictTo('admin'));
router.get('/stats', getStats);
router.get('/users', getAllUsers);
router.put('/users/:id/ban', banUser);
router.get('/jobs', getAllJobs);
router.delete('/jobs/:id', deleteJob);
router.put('/companies/:id/verify', verifyCompany);
router.get('/candidates/pending-verification', getPendingVerifications);
router.put('/candidates/:id/verify', verifyCandidate);

module.exports = router;
