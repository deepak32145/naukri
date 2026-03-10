const express = require('express');
const router = express.Router();
const {
  createCompany, getMyCompany, getCompanyById, updateCompany,
  uploadLogo, getReviews, addReview, searchCompanies,
} = require('../controllers/company.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const { uploadLogo: uploadLogoMw } = require('../config/cloudinary');

router.get('/', searchCompanies);
router.get('/my', protect, restrictTo('recruiter'), getMyCompany);
router.post('/', protect, restrictTo('recruiter'), createCompany);
router.get('/:id', getCompanyById);
router.put('/:id', protect, restrictTo('recruiter'), updateCompany);
router.post('/:id/logo', protect, restrictTo('recruiter'), uploadLogoMw.single('logo'), uploadLogo);
router.get('/:id/reviews', getReviews);
router.post('/:id/reviews', protect, restrictTo('candidate'), addReview);

module.exports = router;
