const express = require('express');
const router = express.Router();
const { getStats, getAllUsers, banUser, getAllJobs, deleteJob, verifyCompany } = require('../controllers/admin.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

router.use(protect, restrictTo('admin'));
router.get('/stats', getStats);
router.get('/users', getAllUsers);
router.put('/users/:id/ban', banUser);
router.get('/jobs', getAllJobs);
router.delete('/jobs/:id', deleteJob);
router.put('/companies/:id/verify', verifyCompany);

module.exports = router;
