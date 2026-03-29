const CandidateProfile = require('../models/CandidateProfile.model');
const { cloudinary } = require('../config/cloudinary');
const { parseResume } = require('../utils/resumeParser');

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

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const total = profile.profileViews.length;
    const thisWeek = profile.profileViews.filter((v) => new Date(v.viewedAt) >= weekAgo).length;
    const recentViews = profile.profileViews.slice(-50).reverse();

    res.json({ success: true, total, thisWeek, profileViews: recentViews });
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

// @POST /api/candidate/verify
const requestVerification = async (req, res) => {
  try {
    const profile = await CandidateProfile.findOne({ userId: req.user._id });
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });
    if (profile.verificationStatus === 'verified') {
      return res.status(400).json({ success: false, message: 'Already verified' });
    }
    if (profile.verificationStatus === 'pending') {
      return res.status(400).json({ success: false, message: 'Verification already requested' });
    }
    if (profile.completenessScore < 60) {
      return res.status(400).json({ success: false, message: 'Profile must be at least 60% complete to request verification' });
    }
    await CandidateProfile.findByIdAndUpdate(profile._id, { verificationStatus: 'pending' });
    res.json({ success: true, message: 'Verification request submitted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @POST /api/candidate/resume/parse
// Accepts a PDF upload (memory storage), returns parsed profile JSON preview.
const parseResumeUpload = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const parsed = await parseResume(req.file.buffer);
    res.json({ success: true, parsed });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @POST /api/candidate/profile/import
// Merges parsed profile data into the candidate's CandidateProfile.
const importParsedProfile = async (req, res) => {
  try {
    const {
      headline, summary, currentLocation, experienceYears, skills,
      githubUrl, linkedinUrl, portfolioUrl,
      experience, education, projects, certifications, languages,
    } = req.body;

    const updateFields = {};
    if (headline) updateFields.headline = headline;
    if (summary) updateFields.summary = summary;
    if (currentLocation) updateFields.currentLocation = currentLocation;
    if (experienceYears != null) updateFields.experienceYears = experienceYears;
    if (skills?.length) updateFields.skills = skills;
    if (githubUrl) updateFields.githubUrl = githubUrl;
    if (linkedinUrl) updateFields.linkedinUrl = linkedinUrl;
    if (portfolioUrl) updateFields.portfolioUrl = portfolioUrl;
    if (experience?.length) updateFields.experience = experience;
    if (education?.length) updateFields.education = education;
    if (projects?.length) updateFields.projects = projects;
    if (certifications?.length) updateFields.certifications = certifications;
    if (languages?.length) updateFields.languages = languages;

    const profile = await CandidateProfile.findOneAndUpdate(
      { userId: req.user._id },
      updateFields,
      { new: true, runValidators: true }
    );
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });

    profile.calculateCompleteness();
    await profile.save();
    res.json({ success: true, profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getProfile, updateProfile, uploadResume, deleteResume, getProfileViews, createJobAlert, getJobAlerts, deleteJobAlert, requestVerification, parseResumeUpload, importParsedProfile };
