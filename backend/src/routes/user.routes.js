const express = require('express');
const router = express.Router();
const { getMe, updateMe, updateAvatar, deleteAccount, getUserById, searchCandidates, getOnlineRecruiters } = require('../controllers/user.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const { uploadAvatar } = require('../config/cloudinary');

router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
router.put('/me/avatar', protect, uploadAvatar.single('avatar'), updateAvatar);
router.delete('/me', protect, deleteAccount);
router.get('/online-recruiters', protect, getOnlineRecruiters);
router.get('/', protect, restrictTo('recruiter', 'admin'), searchCandidates);
router.get('/:id', protect, getUserById);

module.exports = router;
