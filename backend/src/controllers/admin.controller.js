const User = require('../models/User.model');
const Job = require('../models/Job.model');
const Application = require('../models/Application.model');
const Company = require('../models/Company.model');

// @GET /api/admin/stats
const getStats = async (req, res) => {
  try {
    const [totalUsers, totalJobs, totalApplications, totalCompanies,
      candidates, recruiters, activeJobs] = await Promise.all([
      User.countDocuments(),
      Job.countDocuments(),
      Application.countDocuments(),
      Company.countDocuments(),
      User.countDocuments({ role: 'candidate' }),
      User.countDocuments({ role: 'recruiter' }),
      Job.countDocuments({ status: 'active' }),
    ]);

    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5).select('name email role createdAt avatar');
    const recentJobs = await Job.find().sort({ createdAt: -1 }).limit(5)
      .populate('companyId', 'name').select('title location jobType createdAt status');

    res.json({
      success: true,
      stats: { totalUsers, totalJobs, totalApplications, totalCompanies, candidates, recruiters, activeJobs },
      recentUsers,
      recentJobs,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @GET /api/admin/users
const getAllUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 20, search } = req.query;
    const query = {};
    if (role) query.role = role;
    if (search) query.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];
    const skip = (page - 1) * limit;
    const users = await User.find(query).select('-password -otp')
      .sort({ createdAt: -1 }).skip(skip).limit(Number(limit));
    const total = await User.countDocuments(query);
    res.json({ success: true, users, total, page: Number(page) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @PUT /api/admin/users/:id/ban
const banUser = async (req, res) => {
  try {
    const { isBanned } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { isBanned }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user, message: isBanned ? 'User banned' : 'User unbanned' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @GET /api/admin/jobs
const getAllJobs = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const query = {};
    if (search) query.title = new RegExp(search, 'i');
    if (status) query.status = status;
    const skip = (page - 1) * limit;
    const jobs = await Job.find(query)
      .populate('companyId', 'name').populate('postedBy', 'name email')
      .sort({ createdAt: -1 }).skip(skip).limit(Number(limit));
    const total = await Job.countDocuments(query);
    res.json({ success: true, jobs, total });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @DELETE /api/admin/jobs/:id
const deleteJob = async (req, res) => {
  try {
    await Job.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Job removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @PUT /api/admin/companies/:id/verify
const verifyCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(req.params.id, { isVerified: true }, { new: true });
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    res.json({ success: true, company });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getStats, getAllUsers, banUser, getAllJobs, deleteJob, verifyCompany };
