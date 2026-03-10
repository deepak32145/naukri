const CandidateProfile = require('../models/CandidateProfile.model');
const { cloudinary } = require('../config/cloudinary');

// @GET /api/candidate/profile
const getProfile = async (req, res) => {
  try {
    const profile = await CandidateProfile.findOne({ userId: req.user._id })
      .populate('userId', 'name email phone avatar');
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });
    res.json({ success: true, profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @PUT /api/candidate/profile
const updateProfile = async (req, res) => {
  try {
    const {
      headline, summary, skills, currentLocation, preferredLocations,
      expectedSalary, currentSalary, experienceYears, noticePeriod,
      education, experience, projects, certifications, languages,
      isOpenToWork, githubUrl, linkedinUrl, portfolioUrl,
    } = req.body;

    const profile = await CandidateProfile.findOneAndUpdate(
      { userId: req.user._id },
      {
        headline, summary, skills, currentLocation, preferredLocations,
        expectedSalary, currentSalary, experienceYears, noticePeriod,
        education, experience, projects, certifications, languages,
        isOpenToWork, githubUrl, linkedinUrl, portfolioUrl,
      },
      { new: true, runValidators: true }
    );

    profile.calculateCompleteness();
    await profile.save();
    res.json({ success: true, profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @POST /api/candidate/resume
const uploadResume = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const profile = await CandidateProfile.findOne({ userId: req.user._id });
    if (profile && profile.resume && profile.resume.publicId) {
      try { await cloudinary.uploader.destroy(profile.resume.publicId, { resource_type: 'raw' }); } catch (e) {}
    }
    await CandidateProfile.findOneAndUpdate(
      { userId: req.user._id },
      {
        resume: {
          url: req.file.path,
          publicId: req.file.filename,
          name: req.file.originalname,
          uploadedAt: new Date(),
        },
      }
    );
    const updated = await CandidateProfile.findOne({ userId: req.user._id });
    updated.calculateCompleteness();
    await updated.save();
    res.json({ success: true, resume: updated.resume });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @DELETE /api/candidate/resume
const deleteResume = async (req, res) => {
  try {
    const profile = await CandidateProfile.findOne({ userId: req.user._id });
    if (profile && profile.resume && profile.resume.publicId) {
      try { await cloudinary.uploader.destroy(profile.resume.publicId, { resource_type: 'raw' }); } catch (e) {}
    }
    await CandidateProfile.findOneAndUpdate(
      { userId: req.user._id },
      { resume: { url: '', publicId: '', name: '' } }
    );
    res.json({ success: true, message: 'Resume deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @GET /api/candidate/profile-views
const getProfileViews = async (req, res) => {
  try {
    const profile = await CandidateProfile.findOne({ userId: req.user._id })
      .populate('profileViews.viewedBy', 'name avatar role');
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });
    res.json({ success: true, profileViews: profile.profileViews.slice(-50).reverse() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @POST /api/candidate/job-alerts
const createJobAlert = async (req, res) => {
  try {
    const { keyword, location, skills, minSalary, jobType, frequency } = req.body;
    const profile = await CandidateProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $push: { jobAlerts: { keyword, location, skills, minSalary, jobType, frequency } } },
      { new: true }
    );
    res.json({ success: true, jobAlerts: profile.jobAlerts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @GET /api/candidate/job-alerts
const getJobAlerts = async (req, res) => {
  try {
    const profile = await CandidateProfile.findOne({ userId: req.user._id }).select('jobAlerts');
    res.json({ success: true, jobAlerts: profile ? profile.jobAlerts : [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @DELETE /api/candidate/job-alerts/:alertId
const deleteJobAlert = async (req, res) => {
  try {
    await CandidateProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $pull: { jobAlerts: { _id: req.params.alertId } } }
    );
    res.json({ success: true, message: 'Job alert deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getProfile, updateProfile, uploadResume, deleteResume, getProfileViews, createJobAlert, getJobAlerts, deleteJobAlert };
