const { Worker, Queue } = require('bullmq');
const { getRedisConnection } = require('../config/emailQueue');
const { queueEmail, emailTemplates } = require('../utils/email');
const { createNotification } = require('../utils/notification');
const redis = require('../config/redis');

// ── Email Digest ──────────────────────────────────────────────────────────────
// Runs daily at 8am. Sends job matches to candidates based on their alert
// frequency setting (daily = every day, weekly = Mondays only).

const runEmailDigest = async () => {
  const CandidateProfile = require('../models/CandidateProfile.model');
  const Job = require('../models/Job.model');

  const isMonday = new Date().getDay() === 1;

  const profiles = await CandidateProfile.find({
    'jobAlerts.0': { $exists: true }, // has at least one alert
    'jobAlerts.isActive': true,
  }).populate('userId', 'name email');

  for (const profile of profiles) {
    for (const alert of profile.jobAlerts) {
      if (!alert.isActive) continue;
      if (alert.frequency === 'weekly' && !isMonday) continue;

      const since = alert.frequency === 'weekly'
        ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        : new Date(Date.now() - 24 * 60 * 60 * 1000);

      const query = { status: 'active', createdAt: { $gte: since } };

      const orClauses = [];
      if (alert.keyword) orClauses.push({ title: new RegExp(alert.keyword, 'i') });
      if (alert.skills?.length) orClauses.push({ skills: { $in: alert.skills } });
      if (alert.location) orClauses.push({ location: new RegExp(alert.location, 'i') });
      if (orClauses.length) query.$or = orClauses;

      if (alert.minSalary) query.salaryMin = { $gte: alert.minSalary };
      if (alert.jobType) query.jobType = alert.jobType;

      const jobs = await Job.find(query).populate('companyId', 'name').limit(10);
      if (!jobs.length) continue;

      const jobList = jobs.map(j => ({
        title: j.title,
        company: j.companyId?.name || 'Company',
        location: j.location,
        salary: j.salaryMin ? `${j.salaryMin} - ${j.salaryMax} LPA` : null,
      }));

      const tpl = emailTemplates.jobAlert(profile.userId.name, jobList);
      queueEmail({ to: profile.userId.email, ...tpl });
    }
  }

  console.log('Email digest run complete');
};

// ── Profile Completeness Nudges ───────────────────────────────────────────────
// Runs daily. Sends a notification + email to candidates whose profile is < 60%.
// Throttled to once per week per user via a Redis key.

const runCompletenessNudges = async () => {
  const CandidateProfile = require('../models/CandidateProfile.model');

  const profiles = await CandidateProfile.find({
    completenessScore: { $lt: 60 },
  }).populate('userId', 'name email');

  for (const profile of profiles) {
    const nudgeKey = `nudge:${profile.userId._id}`;
    const alreadyNudged = await redis.get(nudgeKey);
    if (alreadyNudged) continue;

    // Throttle: don't nudge again for 7 days
    await redis.setEx(nudgeKey, 7 * 24 * 60 * 60, '1');

    const missing = [];
    if (!profile.headline) missing.push('headline');
    if (!profile.skills?.length) missing.push('skills');
    if (!profile.resume?.url) missing.push('resume');
    if (!profile.experience?.length) missing.push('work experience');
    if (!profile.education?.length) missing.push('education');

    const missingText = missing.slice(0, 2).join(' and ');

    await createNotification({
      userId: profile.userId._id,
      type: 'profile_view',
      title: 'Complete your profile to get more visibility',
      body: `Your profile is ${profile.completenessScore}% complete. Add ${missingText} to attract more recruiters.`,
      link: '/profile',
    });

    queueEmail({
      to: profile.userId.email,
      subject: 'Your Naukri profile needs attention',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <h2 style="color:#4f46e5;">Complete Your Profile</h2>
          <p>Hi ${profile.userId.name},</p>
          <p>Your profile is only <strong>${profile.completenessScore}% complete</strong>.</p>
          <p>Candidates with 80%+ completeness receive <strong>3x more recruiter views</strong>.</p>
          ${missing.length ? `<p>Still missing: <strong>${missing.join(', ')}</strong></p>` : ''}
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/profile"
             style="display:inline-block;background:#4f46e5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px;">
            Complete My Profile
          </a>
        </div>
      `,
    });
  }

  console.log('Completeness nudges run complete');
};

// ── Worker setup ──────────────────────────────────────────────────────────────

const startDigestWorker = () => {
  if (process.env.NODE_ENV === 'test') return;

  const digestQueue = new Queue('digest', {
    connection: getRedisConnection(),
    defaultJobOptions: { removeOnComplete: true, removeOnFail: 100 },
  });

  // Schedule: every day at 8am
  digestQueue.add('daily', {}, {
    repeat: { pattern: '0 8 * * *' },
  }).catch(err => console.error('Failed to schedule digest job:', err.message));

  const worker = new Worker('digest', async () => {
    await runEmailDigest();
    await runCompletenessNudges();
  }, { connection: getRedisConnection() });

  worker.on('completed', () => console.log('Daily digest completed'));
  worker.on('failed', (job, err) => console.error('Digest job failed:', err.message));
  worker.on('error', err => console.error('Digest worker error:', err.message));

  console.log('Digest worker started (runs daily at 8am)');
};

module.exports = { startDigestWorker };
