const request = require('supertest');
const app = require('../src/app');
const CandidateProfile = require('../src/models/CandidateProfile.model');
const { connect, clearDB, disconnect } = require('./setup');
const { createUser } = require('./helpers');

jest.mock('../src/utils/email', () => ({ sendEmail: jest.fn(), emailTemplates: {} }));
jest.mock('../src/utils/socket', () => ({ initSocket: jest.fn(), onlineUsers: new Map() }));
jest.mock('../src/config/cloudinary', () => ({
  cloudinary: { uploader: { destroy: jest.fn() } },
  uploadAvatar: { single: () => (req, res, next) => next() },
  uploadResume: { single: () => (req, res, next) => {
    req.file = { path: 'http://cloudinary.com/resume.pdf', filename: 'resume_123', originalname: 'my_resume.pdf' };
    next();
  }},
  uploadLogo: { single: () => (req, res, next) => next() },
}));

beforeAll(async () => { await connect(); });
afterEach(async () => { await clearDB(); });
afterAll(async () => { await disconnect(); });

// ─── GET /api/candidate/profile ───────────────────────────────────────────────

describe('GET /api/candidate/profile', () => {
  it('returns the candidate profile', async () => {
    const { token } = await createUser('candidate');
    const res = await request(app)
      .get('/api/candidate/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.profile).toBeDefined();
  });

  it('returns 401 without auth token', async () => {
    const res = await request(app).get('/api/candidate/profile');
    expect(res.status).toBe(401);
  });

  it('returns 403 for recruiter role', async () => {
    const { token } = await createUser('recruiter');
    const res = await request(app)
      .get('/api/candidate/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

// ─── PUT /api/candidate/profile ───────────────────────────────────────────────

describe('PUT /api/candidate/profile', () => {
  it('updates headline, summary and skills', async () => {
    const { token } = await createUser('candidate');
    const res = await request(app)
      .put('/api/candidate/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ headline: 'Senior Developer', summary: 'Experienced dev', skills: ['React', 'Node.js'] });
    expect(res.status).toBe(200);
    expect(res.body.profile.headline).toBe('Senior Developer');
    expect(res.body.profile.skills).toContain('React');
  });

  it('updates experience and education arrays', async () => {
    const { token } = await createUser('candidate');
    const res = await request(app)
      .put('/api/candidate/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        experience: [{ company: 'TechCorp', title: 'Dev', from: '2020-01-01', to: '2023-01-01', current: false }],
        education: [{ institution: 'MIT', degree: 'B.Tech', field: 'CS', from: '2016-01-01', to: '2020-01-01' }],
      });
    expect(res.status).toBe(200);
    expect(res.body.profile.experience).toHaveLength(1);
    expect(res.body.profile.education).toHaveLength(1);
  });

  it('updates profile completeness score after update', async () => {
    const { token } = await createUser('candidate');
    const res = await request(app)
      .put('/api/candidate/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ headline: 'Dev', skills: ['React', 'Node.js', 'MongoDB'], experienceYears: 3 });
    expect(res.status).toBe(200);
    expect(typeof res.body.profile.completenessScore).toBe('number');
  });

  it('updates expected salary and location', async () => {
    const { token } = await createUser('candidate');
    const res = await request(app)
      .put('/api/candidate/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ expectedSalary: 1200000, currentLocation: 'Bengaluru', noticePeriod: 30 });
    expect(res.status).toBe(200);
    expect(res.body.profile.expectedSalary).toBe(1200000);
    expect(res.body.profile.currentLocation).toBe('Bengaluru');
  });
});

// ─── POST /api/candidate/resume ───────────────────────────────────────────────

describe('POST /api/candidate/resume', () => {
  it('uploads a resume for the candidate', async () => {
    const { token } = await createUser('candidate');
    const res = await request(app)
      .post('/api/candidate/resume')
      .set('Authorization', `Bearer ${token}`)
      .attach('resume', Buffer.from('fake pdf content'), 'my_resume.pdf');
    expect(res.status).toBe(200);
    expect(res.body.resume.url).toBe('http://cloudinary.com/resume.pdf');
    expect(res.body.resume.name).toBe('my_resume.pdf');
  });

  it('returns 401 without token', async () => {
    const res = await request(app)
      .post('/api/candidate/resume')
      .attach('resume', Buffer.from('content'), 'resume.pdf');
    expect(res.status).toBe(401);
  });
});

// ─── DELETE /api/candidate/resume ─────────────────────────────────────────────

describe('DELETE /api/candidate/resume', () => {
  it('deletes the resume', async () => {
    const { user, token } = await createUser('candidate');
    // Set a resume first
    await CandidateProfile.findOneAndUpdate(
      { userId: user._id },
      { resume: { url: 'http://cloudinary.com/old.pdf', publicId: 'old_123', name: 'old.pdf' } }
    );

    const res = await request(app)
      .delete('/api/candidate/resume')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);

    const profile = await CandidateProfile.findOne({ userId: user._id });
    expect(profile.resume.url).toBe('');
  });

  it('works even when no resume exists (no-op)', async () => {
    const { token } = await createUser('candidate');
    const res = await request(app)
      .delete('/api/candidate/resume')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});

// ─── GET /api/candidate/profile-views ─────────────────────────────────────────

describe('GET /api/candidate/profile-views', () => {
  it('returns empty profile views with zero stats by default', async () => {
    const { token } = await createUser('candidate');
    const res = await request(app)
      .get('/api/candidate/profile-views')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.profileViews).toEqual([]);
    expect(res.body.total).toBe(0);
    expect(res.body.thisWeek).toBe(0);
  });

  it('returns profile views with total and thisWeek counts after a recruiter views', async () => {
    const { user: candidate, token } = await createUser('candidate', { email: 'cand_pv@test.com' });
    const { user: recruiter } = await createUser('recruiter', { email: 'rec_pv@test.com' });
    await CandidateProfile.findOneAndUpdate(
      { userId: candidate._id },
      { $push: { profileViews: { viewedBy: recruiter._id, viewedAt: new Date() } } }
    );

    const res = await request(app)
      .get('/api/candidate/profile-views')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.profileViews).toHaveLength(1);
    expect(res.body.total).toBe(1);
    expect(res.body.thisWeek).toBe(1);
  });

  it('counts only views from the last 7 days in thisWeek', async () => {
    const { user: candidate, token } = await createUser('candidate', { email: 'cand_tw@test.com' });
    const { user: recruiter } = await createUser('recruiter', { email: 'rec_tw@test.com' });

    const oldDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
    await CandidateProfile.findOneAndUpdate(
      { userId: candidate._id },
      {
        $push: {
          profileViews: {
            $each: [
              { viewedBy: recruiter._id, viewedAt: new Date() },      // this week
              { viewedBy: recruiter._id, viewedAt: oldDate },          // older than 7 days
            ],
          },
        },
      }
    );

    const res = await request(app)
      .get('/api/candidate/profile-views')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.thisWeek).toBe(1);
  });

  it('populates recruiter name in profileViews', async () => {
    const { user: candidate, token } = await createUser('candidate', { email: 'cand_pop@test.com' });
    const { user: recruiter } = await createUser('recruiter', { email: 'rec_pop@test.com', name: 'Jane Recruiter' });
    await CandidateProfile.findOneAndUpdate(
      { userId: candidate._id },
      { $push: { profileViews: { viewedBy: recruiter._id, viewedAt: new Date() } } }
    );

    const res = await request(app)
      .get('/api/candidate/profile-views')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.profileViews[0].viewedBy).toBeDefined();
    expect(res.body.profileViews[0].viewedBy.name).toBe('Jane Recruiter');
  });

  it('returns 401 without auth token', async () => {
    const res = await request(app).get('/api/candidate/profile-views');
    expect(res.status).toBe(401);
  });

  it('returns 403 for recruiter role', async () => {
    const { token } = await createUser('recruiter');
    const res = await request(app)
      .get('/api/candidate/profile-views')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('returns most recent views first (newest at top)', async () => {
    const { user: candidate, token } = await createUser('candidate', { email: 'cand_order@test.com' });
    const { user: recruiter } = await createUser('recruiter', { email: 'rec_order@test.com' });

    const older = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const newer = new Date();
    await CandidateProfile.findOneAndUpdate(
      { userId: candidate._id },
      {
        $push: {
          profileViews: {
            $each: [
              { viewedBy: recruiter._id, viewedAt: older },
              { viewedBy: recruiter._id, viewedAt: newer },
            ],
          },
        },
      }
    );

    const res = await request(app)
      .get('/api/candidate/profile-views')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(new Date(res.body.profileViews[0].viewedAt).getTime())
      .toBeGreaterThan(new Date(res.body.profileViews[1].viewedAt).getTime());
  });
});

// ─── POST /api/candidate/job-alerts ───────────────────────────────────────────

describe('POST /api/candidate/job-alerts', () => {
  it('creates a job alert for the candidate', async () => {
    const { token } = await createUser('candidate');
    const res = await request(app)
      .post('/api/candidate/job-alerts')
      .set('Authorization', `Bearer ${token}`)
      .send({ keyword: 'React Developer', location: 'Bengaluru', frequency: 'daily' });
    expect(res.status).toBe(200);
    expect(res.body.jobAlerts).toHaveLength(1);
    expect(res.body.jobAlerts[0].keyword).toBe('React Developer');
  });

  it('creates multiple job alerts', async () => {
    const { token } = await createUser('candidate');
    await request(app)
      .post('/api/candidate/job-alerts')
      .set('Authorization', `Bearer ${token}`)
      .send({ keyword: 'Frontend Dev' });
    const res = await request(app)
      .post('/api/candidate/job-alerts')
      .set('Authorization', `Bearer ${token}`)
      .send({ keyword: 'Backend Dev' });
    expect(res.body.jobAlerts).toHaveLength(2);
  });
});

// ─── GET /api/candidate/job-alerts ────────────────────────────────────────────

describe('GET /api/candidate/job-alerts', () => {
  it('returns all job alerts', async () => {
    const { user, token } = await createUser('candidate');
    await CandidateProfile.findOneAndUpdate(
      { userId: user._id },
      { $push: { jobAlerts: { keyword: 'Node.js Dev', frequency: 'weekly' } } }
    );

    const res = await request(app)
      .get('/api/candidate/job-alerts')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.jobAlerts).toHaveLength(1);
    expect(res.body.jobAlerts[0].keyword).toBe('Node.js Dev');
  });

  it('returns empty array when no alerts', async () => {
    const { token } = await createUser('candidate');
    const res = await request(app)
      .get('/api/candidate/job-alerts')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.jobAlerts).toEqual([]);
  });
});

// ─── DELETE /api/candidate/job-alerts/:alertId ────────────────────────────────

describe('DELETE /api/candidate/job-alerts/:alertId', () => {
  it('deletes a job alert by id', async () => {
    const { user, token } = await createUser('candidate');
    const profile = await CandidateProfile.findOneAndUpdate(
      { userId: user._id },
      { $push: { jobAlerts: { keyword: 'To Delete', frequency: 'daily' } } },
      { new: true }
    );
    const alertId = profile.jobAlerts[0]._id;

    const res = await request(app)
      .delete(`/api/candidate/job-alerts/${alertId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);

    const updated = await CandidateProfile.findOne({ userId: user._id });
    expect(updated.jobAlerts).toHaveLength(0);
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).delete('/api/candidate/job-alerts/fakeid');
    expect(res.status).toBe(401);
  });
});
