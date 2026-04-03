const User = require('../models/User.model');
const CandidateProfile = require('../models/CandidateProfile.model');
const Company = require('../models/Company.model');
const { cloudinary } = require('../config/cloudinary');
const { createNotification } = require('../utils/notification');
const { onlineUsers } = require('../utils/socket');

// @GET /api/users/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    let profile = null;
    if (user.role === 'candidate') {
      profile = await CandidateProfile.findOne({ userId: user._id });
    }
    res.json({ success: true, user, profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @PUT /api/users/me
const updateMe = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const updated = await User.findByIdAndUpdate(req.user._id, { name, phone }, { new: true });
    res.json({ success: true, user: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @PUT /api/users/me/avatar
const updateAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const user = await User.findById(req.user._id);
    if (user.avatar && user.avatar.publicId) {
      await cloudinary.uploader.destroy(user.avatar.publicId);
    }
    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: { url: req.file.path, publicId: req.file.filename } },
      { new: true }
    );
    res.json({ success: true, avatar: updated.avatar });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @DELETE /api/users/me
const deleteAccount = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    await CandidateProfile.findOneAndDelete({ userId: req.user._id });
    res.json({ success: true, message: 'Account deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @GET /api/users/:id  (public profile + log view)
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -otp -isBanned');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    let profile = null;
    if (user.role === 'candidate') {
      profile = await CandidateProfile.findOne({ userId: user._id })
        .select('-jobAlerts -profileViews');

      // Log profile view (don't log own view, only recruiters)
      if (req.user && req.user._id.toString() !== req.params.id && req.user.role === 'recruiter') {
        await CandidateProfile.findOneAndUpdate(
          { userId: req.params.id },
          { $push: { profileViews: { viewedBy: req.user._id, viewedAt: new Date() } } }
        );
        // Notify candidate
        await createNotification({
          userId: user._id,
          type: 'profile_view',
          title: 'Someone viewed your profile',
          body: `${req.user.name} viewed your profile`,
          link: `/profile/${req.user._id}`,
          relatedId: req.user._id,
        });
      }
    }
    res.json({ success: true, user, profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @GET /api/users  (search candidates — recruiters only)
const searchCandidates = async (req, res) => {
  try {
    const { keyword, skills, location, experienceMin, experienceMax, page = 1, limit = 10 } = req.query;
    const query = {};
    if (skills) {
      const skillArr = skills.split(',').map(s => s.trim());
      query.skills = { $in: skillArr.map(s => new RegExp(s, 'i')) };
    }
    if (location) query.currentLocation = new RegExp(location, 'i');
    if (experienceMin || experienceMax) {
      query.experienceYears = {};
      if (experienceMin) query.experienceYears.$gte = Number(experienceMin);
      if (experienceMax) query.experienceYears.$lte = Number(experienceMax);
    }
    if (keyword) {
      query.$or = [
        { headline: new RegExp(keyword, 'i') },
        { summary: new RegExp(keyword, 'i') },
        { skills: { $in: [new RegExp(keyword, 'i')] } },
      ];
    }

    const skip = (page - 1) * limit;
    const profiles = await CandidateProfile.find(query)
      .populate('userId', 'name email avatar')
      .select('-jobAlerts -profileViews -resume.publicId')
      .skip(skip)
      .limit(Number(limit))
      .sort({ completenessScore: -1 });

    const total = await CandidateProfile.countDocuments(query);
    res.json({ success: true, profiles, total, page: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @GET /api/users/online-recruiters
const getOnlineRecruiters = async (req, res) => {
  try {
    const onlineIds = Array.from(onlineUsers.keys());
    const recruiters = await User.find({
      _id: { $in: onlineIds },
      role: 'recruiter',
      isActive: true,
      isBanned: false,
    }).select('name avatar lastSeen').lean();

    const companies = await Company.find({
      createdBy: { $in: recruiters.map((r) => r._id) },
    }).select('name logo industry location createdBy').lean();

    const companyMap = {};
    companies.forEach((c) => { companyMap[c.createdBy.toString()] = c; });

    const result = recruiters.map((r) => ({
      ...r,
      isOnline: true,
      company: companyMap[r._id.toString()] || null,
    }));

    res.json({ success: true, recruiters: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getMe, updateMe, updateAvatar, deleteAccount, getUserById, searchCandidates, getOnlineRecruiters };
