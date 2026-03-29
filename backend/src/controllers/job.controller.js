const Job = require('../models/Job.model');
const Company = require('../models/Company.model');
const CandidateProfile = require('../models/CandidateProfile.model');
const User = require('../models/User.model');
const { queueEmail, emailTemplates } = require('../utils/email');
const redis = require('../config/redis');

// Invalidate all job-listing cache keys (called on any job mutation)
const invalidateJobListCache = async () => {
  const listKeys = await redis.keys('jobs:*');
  await redis.del(listKeys);
};

// @POST /api/jobs
const createJob = async (req, res) => {
  try {
    const company = await Company.findOne({ createdBy: req.user._id });
    if (!company) return res.status(400).json({ success: false, message: 'Create a company profile first' });

    const job = await Job.create({ ...req.body, companyId: company._id, postedBy: req.user._id });
    await Company.findByIdAndUpdate(company._id, { $inc: { jobsCount: 1 } });

    // New job changes listings — invalidate cache
    await invalidateJobListCache();

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
    queueEmail({ to: profile.userId.email, ...tpl });
  }
};

// @GET /api/jobs  (search + filter)
const getJobs = async (req, res) => {
  try {
    // Build a stable cache key from sorted query params
    const cacheKey = `jobs:${JSON.stringify(
      Object.keys(req.query).sort().reduce((acc, k) => { acc[k] = req.query[k]; return acc; }, {})
    )}`;

    const cached = await redis.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

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
    if (experienceMin) query.experienceMin = { $gte: Number(experienceMin) };
    if (experienceMax) query.experienceMax = { $lte: Number(experienceMax) };
    if (salaryMin) query.salaryMin = { $gte: Number(salaryMin) };
    if (salaryMax) query.salaryMax = { $lte: Number(salaryMax) };
    if (skills) {
      const skillArr = skills.split(',').map(s => s.trim());
      query.skills = { $in: skillArr.map(s => new RegExp(s, 'i')) };
    }

    const sortMap = { newest: { createdAt: -1 }, salary: { salaryMax: -1 }, relevant: { viewsCount: -1 } };
    // Featured jobs always float to the top regardless of sort option
    const sortOpt = { isFeatured: -1, ...(sortMap[sort] || { createdAt: -1 }) };

    const skip = (page - 1) * limit;
    const jobs = await Job.find(query)
      .populate('companyId', 'name logo location isVerified')
      .sort(sortOpt)
      .skip(skip)
      .limit(Number(limit));

    const total = await Job.countDocuments(query);
    const result = { success: true, jobs, total, page: Number(page), totalPages: Math.ceil(total / limit) };

    // Cache for 2 minutes
    await redis.setEx(cacheKey, 120, JSON.stringify(result));
    res.json(result);
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
    const cacheKey = `job:${req.params.id}`;

    let job, similar;
    const cached = await redis.get(cacheKey);

    if (cached) {
      ({ job, similar } = JSON.parse(cached));
    } else {
      job = await Job.findById(req.params.id)
        .populate('companyId', 'name logo description location industry size website isVerified rating reviewCount')
        .populate('postedBy', 'name');
      if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

      similar = await Job.find({
        _id: { $ne: job._id },
        status: 'active',
        $or: [
          { skills: { $in: job.skills } },
          { industry: job.industry },
        ],
      }).populate('companyId', 'name logo').limit(5);

      // Cache job + similar for 5 minutes
      await redis.setEx(cacheKey, 300, JSON.stringify({ job, similar }));
    }

    // Always track the view (lightweight update, not cached)
    await Job.findByIdAndUpdate(req.params.id, { $inc: { viewsCount: 1 } });

    // isSaved and hasApplied are user-specific — always computed fresh
    let isSaved = false;
    let hasApplied = false;
    if (req.user) {
      const savedBy = job.savedBy || [];
      isSaved = savedBy.some((id) => id.toString() === req.user._id.toString());
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
    await invalidateJobListCache();
    await redis.del([`job:${req.params.id}`]);
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
    await invalidateJobListCache();
    await redis.del([`job:${req.params.id}`]);
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
    await invalidateJobListCache();
    await redis.del([`job:${req.params.id}`]);
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

// @PUT /api/jobs/:id/feature  (recruiter — toggle featured status)
const toggleFeatured = async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, postedBy: req.user._id });
    if (!job) return res.status(404).json({ success: false, message: 'Job not found or not authorized' });
    job.isFeatured = !job.isFeatured;
    await job.save();
    await invalidateJobListCache();
    await redis.del([`job:${req.params.id}`]);
    res.json({ success: true, isFeatured: job.isFeatured });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @GET /api/jobs/:id/match  (candidate — match score against their profile)
const getMatchScore = async (req, res) => {
  try {
    const [job, profile] = await Promise.all([
      Job.findById(req.params.id),
      CandidateProfile.findOne({ userId: req.user._id }),
    ]);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (!profile) return res.json({ success: true, score: 0, breakdown: {} });

    const breakdown = {};

    // Skills — 40 pts
    const jobSkills = job.skills.map(s => s.toLowerCase());
    const mySkills = (profile.skills || []).map(s => s.toLowerCase());
    const matched = jobSkills.filter(s => mySkills.includes(s));
    breakdown.skills = jobSkills.length > 0
      ? Math.round((matched.length / jobSkills.length) * 40)
      : 20;
    breakdown.matchedSkills = matched;
    breakdown.missingSkills = jobSkills.filter(s => !mySkills.includes(s));

    // Experience — 30 pts
    const exp = profile.experienceYears || 0;
    if (exp >= job.experienceMin && exp <= job.experienceMax) {
      breakdown.experience = 30;
    } else if (exp >= job.experienceMin - 1) {
      breakdown.experience = 15;
    } else {
      breakdown.experience = 0;
    }

    // Location — 20 pts
    if (job.isRemote) {
      breakdown.location = 20;
    } else if (profile.currentLocation && job.location.toLowerCase().includes(profile.currentLocation.toLowerCase())) {
      breakdown.location = 20;
    } else if ((profile.preferredLocations || []).some(l => job.location.toLowerCase().includes(l.toLowerCase()))) {
      breakdown.location = 10;
    } else {
      breakdown.location = 0;
    }

    // Salary — 10 pts
    if (profile.expectedSalary && job.salaryMax) {
      breakdown.salary = profile.expectedSalary <= job.salaryMax ? 10 : 0;
    } else {
      breakdown.salary = 5;
    }

    const score = breakdown.skills + breakdown.experience + breakdown.location + breakdown.salary;
    res.json({ success: true, score, breakdown });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @GET /api/jobs/autocomplete?q=  (public — Redis-cached suggestions)
const autocomplete = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) return res.json({ success: true, suggestions: [] });

    const cacheKey = `autocomplete:${q.toLowerCase().trim()}`;
    const cached = await redis.get(cacheKey);
    if (cached) return res.json({ success: true, suggestions: JSON.parse(cached) });

    const [titles, companies] = await Promise.all([
      Job.distinct('title', { title: new RegExp(q, 'i'), status: 'active' }),
      Company.distinct('name', { name: new RegExp(q, 'i') }),
    ]);

    const suggestions = [
      ...titles.slice(0, 5).map(t => ({ type: 'title', value: t })),
      ...companies.slice(0, 3).map(c => ({ type: 'company', value: c })),
    ];

    await redis.setEx(cacheKey, 600, JSON.stringify(suggestions)); // 10 min TTL
    res.json({ success: true, suggestions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createJob, getJobs, getRecommendedJobs, getMyJobs, getSavedJobs,
  getJobById, updateJob, deleteJob, updateJobStatus, saveJob, unsaveJob,
  toggleFeatured, getMatchScore, autocomplete,
};
