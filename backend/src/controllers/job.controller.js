const Job = require('../models/Job.model');
const Company = require('../models/Company.model');
const CandidateProfile = require('../models/CandidateProfile.model');
const User = require('../models/User.model');
const { sendEmail, emailTemplates } = require('../utils/email');

// @POST /api/jobs
const createJob = async (req, res) => {
  try {
    const company = await Company.findOne({ createdBy: req.user._id });
    if (!company) return res.status(400).json({ success: false, message: 'Create a company profile first' });

    const job = await Job.create({ ...req.body, companyId: company._id, postedBy: req.user._id });
    await Company.findByIdAndUpdate(company._id, { $inc: { jobsCount: 1 } });

    // Trigger job alerts (async, don't block response)
    triggerJobAlerts(job).catch(console.error);

    res.status(201).json({ success: true, job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper: match and notify candidates with job alerts
const triggerJobAlerts = async (job) => {
  const profiles = await CandidateProfile.find({
    'jobAlerts.isActive': true,
    $or: [
      { 'jobAlerts.keyword': { $regex: job.title, $options: 'i' } },
      { 'jobAlerts.skills': { $in: job.skills } },
      { 'jobAlerts.location': { $regex: job.location, $options: 'i' } },
    ],
  }).populate('userId', 'name email');

  for (const profile of profiles) {
    const company = await Company.findById(job.companyId);
    const tpl = emailTemplates.jobAlert(profile.userId.name, [{
      title: job.title,
      company: company?.name || 'Company',
      location: job.location,
      salary: job.salaryMin ? `${job.salaryMin} - ${job.salaryMax} LPA` : null,
    }]);
    await sendEmail({ to: profile.userId.email, ...tpl });
  }
};

// @GET /api/jobs  (search + filter)
const getJobs = async (req, res) => {
  try {
    const {
      keyword, location, jobType, experienceMin, experienceMax,
      salaryMin, salaryMax, skills, industry, page = 1, limit = 10, sort = 'newest',
    } = req.query;

    const query = { status: 'active' };

    if (keyword) {
      query.$or = [
        { title: new RegExp(keyword, 'i') },
        { description: new RegExp(keyword, 'i') },
        { skills: { $in: [new RegExp(keyword, 'i')] } },
      ];
    }
    if (location) query.location = new RegExp(location, 'i');
    if (jobType) query.jobType = jobType;
    if (industry) query.industry = new RegExp(industry, 'i');
    if (experienceMin !== undefined) query.experienceMin = { $gte: Number(experienceMin) };
    if (experienceMax !== undefined) query.experienceMax = { $lte: Number(experienceMax) };
    if (salaryMin) query.salaryMin = { $gte: Number(salaryMin) };
    if (salaryMax) query.salaryMax = { $lte: Number(salaryMax) };
    if (skills) {
      const skillArr = skills.split(',').map(s => s.trim());
      query.skills = { $in: skillArr.map(s => new RegExp(s, 'i')) };
    }

    const sortMap = { newest: { createdAt: -1 }, salary: { salaryMax: -1 }, relevant: { viewsCount: -1 } };
    const sortOpt = sortMap[sort] || { createdAt: -1 };

    const skip = (page - 1) * limit;
    const jobs = await Job.find(query)
      .populate('companyId', 'name logo location isVerified')
      .sort(sortOpt)
      .skip(skip)
      .limit(Number(limit));

    const total = await Job.countDocuments(query);
    res.json({ success: true, jobs, total, page: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @GET /api/jobs/recommended
const getRecommendedJobs = async (req, res) => {
  try {
    const profile = await CandidateProfile.findOne({ userId: req.user._id });
    if (!profile) return res.json({ success: true, jobs: [] });

    const query = { status: 'active', $or: [] };
    if (profile.skills && profile.skills.length > 0) {
      query.$or.push({ skills: { $in: profile.skills.map(s => new RegExp(s, 'i')) } });
    }
    if (profile.currentLocation) {
      query.$or.push({ location: new RegExp(profile.currentLocation, 'i') });
    }
    if (query.$or.length === 0) delete query.$or;

    const jobs = await Job.find(query)
      .populate('companyId', 'name logo location isVerified')
      .limit(10)
      .sort({ createdAt: -1 });

    res.json({ success: true, jobs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @GET /api/jobs/my-jobs  (recruiter)
const getMyJobs = async (req, res) => {
  try {
    const company = await Company.findOne({ createdBy: req.user._id });
    if (!company) return res.json({ success: true, jobs: [] });
    const jobs = await Job.find({ companyId: company._id }).sort({ createdAt: -1 });
    res.json({ success: true, jobs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @GET /api/jobs/saved
const getSavedJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ savedBy: req.user._id })
      .populate('companyId', 'name logo location isVerified')
      .sort({ createdAt: -1 });
    res.json({ success: true, jobs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @GET /api/jobs/:id
const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('companyId', 'name logo description location industry size website isVerified rating reviewCount')
      .populate('postedBy', 'name');
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    // Track views
    await Job.findByIdAndUpdate(req.params.id, { $inc: { viewsCount: 1 } });

    // Similar jobs
    const similar = await Job.find({
      _id: { $ne: job._id },
      status: 'active',
      $or: [
        { skills: { $in: job.skills } },
        { industry: job.industry },
      ],
    }).populate('companyId', 'name logo').limit(5);

    // Check if saved by current user
    let isSaved = false;
    let hasApplied = false;
    if (req.user) {
      isSaved = job.savedBy.includes(req.user._id);
      const Application = require('../models/Application.model');
      const app = await Application.findOne({ jobId: job._id, candidateId: req.user._id });
      hasApplied = !!app;
    }

    res.json({ success: true, job, similar, isSaved, hasApplied });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @PUT /api/jobs/:id
const updateJob = async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, postedBy: req.user._id });
    if (!job) return res.status(404).json({ success: false, message: 'Job not found or not authorized' });
    Object.assign(job, req.body);
    await job.save();
    res.json({ success: true, job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @DELETE /api/jobs/:id
const deleteJob = async (req, res) => {
  try {
    const job = await Job.findOneAndDelete({ _id: req.params.id, postedBy: req.user._id });
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    res.json({ success: true, message: 'Job deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @PUT /api/jobs/:id/status
const updateJobStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, postedBy: req.user._id },
      { status },
      { new: true }
    );
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    res.json({ success: true, job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @POST /api/jobs/:id/save
const saveJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (job.savedBy.includes(req.user._id)) {
      return res.status(400).json({ success: false, message: 'Job already saved' });
    }
    await Job.findByIdAndUpdate(req.params.id, { $push: { savedBy: req.user._id } });
    res.json({ success: true, message: 'Job saved' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @DELETE /api/jobs/:id/save
const unsaveJob = async (req, res) => {
  try {
    await Job.findByIdAndUpdate(req.params.id, { $pull: { savedBy: req.user._id } });
    res.json({ success: true, message: 'Job unsaved' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createJob, getJobs, getRecommendedJobs, getMyJobs, getSavedJobs,
  getJobById, updateJob, deleteJob, updateJobStatus, saveJob, unsaveJob,
};
