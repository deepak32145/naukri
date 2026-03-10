const Application = require('../models/Application.model');
const Job = require('../models/Job.model');
const User = require('../models/User.model');
const Company = require('../models/Company.model');
const { createNotification } = require('../utils/notification');
const { sendEmail, emailTemplates } = require('../utils/email');

let io;
const setIo = (socketIo) => { io = socketIo; };

// @POST /api/applications/jobs/:jobId/apply
const applyToJob = async (req, res) => {
  try {
    const { coverLetter } = req.body;
    const job = await Job.findById(req.params.jobId).populate('companyId', 'name');
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (job.status !== 'active') return res.status(400).json({ success: false, message: 'Job is not accepting applications' });

    const existing = await Application.findOne({ jobId: req.params.jobId, candidateId: req.user._id });
    if (existing) return res.status(400).json({ success: false, message: 'Already applied to this job' });

    const { CandidateProfile } = require('../models/CandidateProfile.model') || {};
    const CandidateProfileModel = require('../models/CandidateProfile.model');
    const profile = await CandidateProfileModel.findOne({ userId: req.user._id });

    const application = await Application.create({
      jobId: req.params.jobId,
      candidateId: req.user._id,
      coverLetter,
      resume: profile?.resume ? { url: profile.resume.url, name: profile.resume.name } : {},
      timeline: [{ status: 'applied', note: 'Application submitted', updatedBy: req.user._id }],
    });

    await Job.findByIdAndUpdate(req.params.jobId, { $inc: { applicationsCount: 1 } });

    // Notify recruiter
    const recruiter = await User.findById(job.postedBy);
    if (recruiter) {
      await createNotification({
        userId: recruiter._id,
        type: 'new_applicant',
        title: `New application for ${job.title}`,
        body: `${req.user.name} applied to ${job.title}`,
        link: `/recruiter/jobs/${job._id}/applicants`,
        relatedId: application._id,
        io,
      });
    }

    res.status(201).json({ success: true, application });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @GET /api/applications/my-applications
const getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({ candidateId: req.user._id })
      .populate({ path: 'jobId', populate: { path: 'companyId', select: 'name logo location' } })
      .sort({ createdAt: -1 });
    res.json({ success: true, applications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @GET /api/applications/jobs/:jobId/applications  (recruiter)
const getJobApplications = async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.jobId, postedBy: req.user._id });
    if (!job) return res.status(404).json({ success: false, message: 'Job not found or not authorized' });

    const { status, page = 1, limit = 20 } = req.query;
    const query = { jobId: req.params.jobId };
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const applications = await Application.find(query)
      .populate('candidateId', 'name email avatar phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Get candidate profiles
    const CandidateProfileModel = require('../models/CandidateProfile.model');
    const appWithProfiles = await Promise.all(applications.map(async (app) => {
      const profile = await CandidateProfileModel.findOne({ userId: app.candidateId._id })
        .select('headline skills experienceYears resume currentLocation completenessScore');
      return { ...app.toObject(), candidateProfile: profile };
    }));

    const total = await Application.countDocuments(query);
    res.json({ success: true, applications: appWithProfiles, total });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @PUT /api/applications/:id/status  (recruiter updates status)
const updateApplicationStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const application = await Application.findById(req.params.id)
      .populate('candidateId', 'name email')
      .populate({ path: 'jobId', populate: { path: 'companyId', select: 'name' } });

    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });

    // Verify recruiter owns this job
    const job = await Job.findOne({ _id: application.jobId._id, postedBy: req.user._id });
    if (!job) return res.status(403).json({ success: false, message: 'Not authorized' });

    application.status = status;
    application.timeline.push({ status, note: note || '', updatedBy: req.user._id });
    await application.save();

    // Notify candidate
    await createNotification({
      userId: application.candidateId._id,
      type: 'application_update',
      title: `Application ${status.replace(/_/g, ' ')}`,
      body: `Your application for ${application.jobId.title} is now ${status.replace(/_/g, ' ')}`,
      link: `/applications`,
      relatedId: application._id,
      io,
    });

    // Email notification
    const companyName = application.jobId.companyId?.name || 'the company';
    const tpl = emailTemplates.applicationStatus(
      application.candidateId.name,
      application.jobId.title,
      companyName,
      status
    );
    await sendEmail({ to: application.candidateId.email, ...tpl });

    if (io) {
      io.to(application.candidateId._id.toString()).emit('application_status_update', {
        applicationId: application._id,
        status,
        jobTitle: application.jobId.title,
      });
    }

    res.json({ success: true, application });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @PUT /api/applications/:id/interview
const scheduleInterview = async (req, res) => {
  try {
    const { date, time, mode, link, notes } = req.body;
    const application = await Application.findById(req.params.id)
      .populate('candidateId', 'name email')
      .populate({ path: 'jobId', populate: { path: 'companyId', select: 'name' } });

    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });
    const job = await Job.findOne({ _id: application.jobId._id, postedBy: req.user._id });
    if (!job) return res.status(403).json({ success: false, message: 'Not authorized' });

    application.interviewDetails = { date, time, mode, link, notes };
    application.status = 'interview_scheduled';
    application.timeline.push({ status: 'interview_scheduled', note: `Interview scheduled for ${date} at ${time}`, updatedBy: req.user._id });
    await application.save();

    const companyName = application.jobId.companyId?.name || 'the company';
    await createNotification({
      userId: application.candidateId._id,
      type: 'interview_scheduled',
      title: 'Interview Scheduled!',
      body: `Interview for ${application.jobId.title} on ${date}`,
      link: `/applications`,
      relatedId: application._id,
      io,
    });

    const tpl = emailTemplates.interviewScheduled(
      application.candidateId.name,
      application.jobId.title,
      companyName,
      date, time, mode, link
    );
    await sendEmail({ to: application.candidateId.email, ...tpl });

    res.json({ success: true, application });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @DELETE /api/applications/:id  (candidate withdraws)
const withdrawApplication = async (req, res) => {
  try {
    const application = await Application.findOneAndDelete({
      _id: req.params.id,
      candidateId: req.user._id,
    });
    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });
    await Job.findByIdAndUpdate(application.jobId, { $inc: { applicationsCount: -1 } });
    res.json({ success: true, message: 'Application withdrawn' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { setIo, applyToJob, getMyApplications, getJobApplications, updateApplicationStatus, scheduleInterview, withdrawApplication };
