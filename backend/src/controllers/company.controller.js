const Company = require('../models/Company.model');
const Review = require('../models/Review.model');
const { cloudinary } = require('../config/cloudinary');

// @POST /api/companies
const createCompany = async (req, res) => {
  try {
    const { name, description, industry, size, website, location, founded, linkedIn } = req.body;
    const existing = await Company.findOne({ createdBy: req.user._id });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You already have a company profile' });
    }
    const company = await Company.create({
      name, description, industry, size, website, location, founded, linkedIn,
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, company });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @GET /api/companies/my
const getMyCompany = async (req, res) => {
  try {
    const company = await Company.findOne({ createdBy: req.user._id });
    res.json({ success: true, company });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @GET /api/companies/:id
const getCompanyById = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id).populate('createdBy', 'name email');
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    res.json({ success: true, company });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @PUT /api/companies/:id
const updateCompany = async (req, res) => {
  try {
    const company = await Company.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!company) return res.status(404).json({ success: false, message: 'Company not found or not authorized' });
    const { name, description, industry, size, website, location, founded, linkedIn } = req.body;
    Object.assign(company, { name, description, industry, size, website, location, founded, linkedIn });
    await company.save();
    res.json({ success: true, company });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @POST /api/companies/:id/logo
const uploadLogo = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const company = await Company.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    if (company.logo && company.logo.publicId) {
      try { await cloudinary.uploader.destroy(company.logo.publicId); } catch (e) {}
    }
    company.logo = { url: req.file.path, publicId: req.file.filename };
    await company.save();
    res.json({ success: true, logo: company.logo });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @GET /api/companies/:id/reviews
const getReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ companyId: req.params.id })
      .populate('candidateId', 'name avatar')
      .sort({ createdAt: -1 });
    // For anonymous reviews, hide candidateId name
    const safeReviews = reviews.map(r => {
      const obj = r.toObject();
      if (obj.isAnonymous) { obj.candidateId = { name: 'Anonymous', avatar: { url: '' } }; }
      return obj;
    });
    res.json({ success: true, reviews: safeReviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @POST /api/companies/:id/reviews
const addReview = async (req, res) => {
  try {
    const { rating, title, pros, cons, isAnonymous } = req.body;
    const existing = await Review.findOne({ companyId: req.params.id, candidateId: req.user._id });
    if (existing) return res.status(400).json({ success: false, message: 'You have already reviewed this company' });

    const review = await Review.create({
      companyId: req.params.id,
      candidateId: req.user._id,
      rating, title, pros, cons, isAnonymous,
    });
    // Update company rating
    const allReviews = await Review.find({ companyId: req.params.id });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await Company.findByIdAndUpdate(req.params.id, { rating: avgRating, reviewCount: allReviews.length });
    res.status(201).json({ success: true, review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @GET /api/companies
const searchCompanies = async (req, res) => {
  try {
    const { keyword, industry, page = 1, limit = 10 } = req.query;
    const query = {};
    if (keyword) query.name = new RegExp(keyword, 'i');
    if (industry) query.industry = new RegExp(industry, 'i');
    const skip = (page - 1) * limit;
    const companies = await Company.find(query).skip(skip).limit(Number(limit)).sort({ rating: -1 });
    const total = await Company.countDocuments(query);
    res.json({ success: true, companies, total, page: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createCompany, getMyCompany, getCompanyById, updateCompany, uploadLogo, getReviews, addReview, searchCompanies };
