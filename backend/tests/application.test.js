const request = require('supertest');
const app = require('../src/app');
const { connect, clearDB, disconnect } = require('./setup');
const { createUser, createCompany, createJob, createApplication } = require('./helpers');

jest.mock('../src/utils/email', () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
  emailTemplates: {
    verifyEmail: jest.fn().mockReturnValue({ subject: '', html: '' }),
    applicationStatus: jest.fn().mockReturnValue({ subject: '', html: '' }),
    interviewScheduled: jest.fn().mockReturnValue({ subject: '', html: '' }),
    jobAlert: jest.fn().mockReturnValue({ subject: '', html: '' }),
  },
}));
jest.mock('../src/utils/socket', () => ({ initSocket: jest.fn(), onlineUsers: new Map() }));
jest.mock('../src/utils/notification', () => ({
  createNotification: jest.fn().mockResolvedValue(true),
}));
jest.mock('../src/config/cloudinary', () => ({
  cloudinary: { uploader: { destroy: jest.fn() } },
  uploadAvatar: { single: () => (req, res, next) => next() },
  uploadResume: { single: () => (req, res, next) => next() },
  uploadLogo: { single: () => (req, res, next) => next() },
}));

beforeAll(async () => { await connect(); });
afterEach(async () => { await clearDB(); });
afterAll(async () => { await disconnect(); });

// ─── APPLY TO JOB ────────────────────────────────────────────────────────────

describe('POST /api/applications/jobs/:jobId/apply', () => {
  it('applies to a job successfully', async () => {
    const { user: r } = await createUser('recruiter', { email: 'r@apply.com' });
    const company = await createCompany(r._id);
    const job = await createJob(r._id, company._id);
    const { token: cToken } = await createUser('candidate', { email: 'c@apply.com' });

    const res = await request(app)
      .post(`/api/applications/jobs/${job._id}/apply`)
      .set('Authorization', `Bearer ${cToken}`)
      .send({ coverLetter: 'I am a great fit' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.application.status).toBe('applied');
  });

  it('returns 404 when job does not exist', async () => {
    const { token: cToken } = await createUser('candidate');
    const res = await request(app)
      .post('/api/applications/jobs/64a0000000000000000000dd/apply')
      .set('Authorization', `Bearer ${cToken}`)
      .send({});
    expect(res.status).toBe(404);
  });

  it('returns 400 when job is not active', async () => {
    const { user: r } = await createUser('recruiter', { email: 'r2@apply.com' });
    const company = await createCompany(r._id);
    const job = await createJob(r._id, company._id, { status: 'closed' });
    const { token: cToken } = await createUser('candidate', { email: 'c2@apply.com' });

    const res = await request(app)
      .post(`/api/applications/jobs/${job._id}/apply`)
      .set('Authorization', `Bearer ${cToken}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/not accepting/i);
  });

  it('returns 400 when candidate already applied', async () => {
    const { user: r } = await createUser('recruiter', { email: 'r3@apply.com' });
    const company = await createCompany(r._id);
    const job = await createJob(r._id, company._id);
    const { user: c, token: cToken } = await createUser('candidate', { email: 'c3@apply.com' });

    await createApplication(job._id, c._id);
    const res = await request(app)
      .post(`/api/applications/jobs/${job._id}/apply`)
      .set('Authorization', `Bearer ${cToken}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already applied/i);
  });
});

// ─── MY APPLICATIONS ─────────────────────────────────────────────────────────

describe('GET /api/applications/my-applications', () => {
  it('returns all applications for the logged-in candidate', async () => {
    const { user: r } = await createUser('recruiter', { email: 'r@myapp.com' });
    const company = await createCompany(r._id);
    const job1 = await createJob(r._id, company._id, { title: 'Job A' });
    const job2 = await createJob(r._id, company._id, { title: 'Job B' });
    const { user: c, token } = await createUser('candidate', { email: 'c@myapp.com' });
    await createApplication(job1._id, c._id);
    await createApplication(job2._id, c._id);

    const res = await request(app)
      .get('/api/applications/my-applications')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.applications.length).toBe(2);
  });

  it('returns empty array when no applications', async () => {
    const { token } = await createUser('candidate');
    const res = await request(app)
      .get('/api/applications/my-applications')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.applications.length).toBe(0);
  });
});

// ─── JOB APPLICATIONS (recruiter) ────────────────────────────────────────────

describe('GET /api/applications/jobs/:jobId/applications', () => {
  it('returns applicants for the recruiter\'s job', async () => {
    const { user: r, token } = await createUser('recruiter', { email: 'r@jobapps.com' });
    const company = await createCompany(r._id);
    const job = await createJob(r._id, company._id);
    const { user: c } = await createUser('candidate', { email: 'c@jobapps.com' });
    await createApplication(job._id, c._id);

    const res = await request(app)
      .get(`/api/applications/jobs/${job._id}/applications`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.applications.length).toBe(1);
  });

  it('returns 404 when recruiter does not own the job', async () => {
    const { user: r1 } = await createUser('recruiter', { email: 'r1@ja.com' });
    const { token: token2 } = await createUser('recruiter', { email: 'r2@ja.com' });
    const company = await createCompany(r1._id);
    const job = await createJob(r1._id, company._id);

    const res = await request(app)
      .get(`/api/applications/jobs/${job._id}/applications`)
      .set('Authorization', `Bearer ${token2}`);
    expect(res.status).toBe(404);
  });
});

// ─── UPDATE APPLICATION STATUS ────────────────────────────────────────────────

describe('PUT /api/applications/:id/status', () => {
  it('updates application status successfully', async () => {
    const { user: r, token } = await createUser('recruiter', { email: 'r@status.com' });
    const company = await createCompany(r._id);
    const job = await createJob(r._id, company._id);
    const { user: c } = await createUser('candidate', { email: 'c@status.com' });
    const application = await createApplication(job._id, c._id);

    const res = await request(app)
      .put(`/api/applications/${application._id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'shortlisted', note: 'Good profile' });
    expect(res.status).toBe(200);
    expect(res.body.application.status).toBe('shortlisted');
  });

  it('returns 403 when recruiter does not own the job', async () => {
    const { user: r1 } = await createUser('recruiter', { email: 'r1@stat.com' });
    const { token: token2 } = await createUser('recruiter', { email: 'r2@stat.com' });
    const company = await createCompany(r1._id);
    const job = await createJob(r1._id, company._id);
    const { user: c } = await createUser('candidate', { email: 'c@stat.com' });
    const application = await createApplication(job._id, c._id);

    const res = await request(app)
      .put(`/api/applications/${application._id}/status`)
      .set('Authorization', `Bearer ${token2}`)
      .send({ status: 'rejected' });
    expect(res.status).toBe(403);
  });
});

// ─── SCHEDULE INTERVIEW ───────────────────────────────────────────────────────

describe('PUT /api/applications/:id/interview', () => {
  it('schedules an interview', async () => {
    const { user: r, token } = await createUser('recruiter', { email: 'r@interview.com' });
    const company = await createCompany(r._id);
    const job = await createJob(r._id, company._id);
    const { user: c } = await createUser('candidate', { email: 'c@interview.com' });
    const application = await createApplication(job._id, c._id);

    const res = await request(app)
      .put(`/api/applications/${application._id}/interview`)
      .set('Authorization', `Bearer ${token}`)
      .send({ date: '2026-04-15', time: '10:00', mode: 'online', link: 'https://meet.google.com/abc' });
    expect(res.status).toBe(200);
    expect(res.body.application.status).toBe('interview_scheduled');
    expect(res.body.application.interviewDetails.mode).toBe('online');
  });
});

// ─── WITHDRAW APPLICATION ─────────────────────────────────────────────────────

describe('DELETE /api/applications/:id', () => {
  it('withdraws own application', async () => {
    const { user: r } = await createUser('recruiter', { email: 'r@withdraw.com' });
    const company = await createCompany(r._id);
    const job = await createJob(r._id, company._id);
    const { user: c, token } = await createUser('candidate', { email: 'c@withdraw.com' });
    const application = await createApplication(job._id, c._id);

    const res = await request(app)
      .delete(`/api/applications/${application._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 404 when application does not belong to the candidate', async () => {
    const { user: r } = await createUser('recruiter', { email: 'r@wd2.com' });
    const company = await createCompany(r._id);
    const job = await createJob(r._id, company._id);
    const { user: c1 } = await createUser('candidate', { email: 'c1@wd.com' });
    const { token: token2 } = await createUser('candidate', { email: 'c2@wd.com' });
    const application = await createApplication(job._id, c1._id);

    const res = await request(app)
      .delete(`/api/applications/${application._id}`)
      .set('Authorization', `Bearer ${token2}`);
    expect(res.status).toBe(404);
  });
});
