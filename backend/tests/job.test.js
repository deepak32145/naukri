const request = require('supertest');
const app = require('../src/app');
const { connect, clearDB, disconnect } = require('./setup');
const { createUser, createCompany, createJob } = require('./helpers');

jest.mock('../src/utils/email', () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
  emailTemplates: {
    verifyEmail: jest.fn().mockReturnValue({ subject: '', html: '' }),
    jobAlert: jest.fn().mockReturnValue({ subject: '', html: '' }),
  },
}));
jest.mock('../src/utils/socket', () => ({ initSocket: jest.fn(), onlineUsers: new Map() }));
jest.mock('../src/config/cloudinary', () => ({
  cloudinary: { uploader: { destroy: jest.fn() } },
  uploadAvatar: { single: () => (req, res, next) => next() },
  uploadResume: { single: () => (req, res, next) => next() },
  uploadLogo: { single: () => (req, res, next) => next() },
}));

beforeAll(async () => { await connect(); });
afterEach(async () => { await clearDB(); });
afterAll(async () => { await disconnect(); });

// ─── CREATE JOB ───────────────────────────────────────────────────────────────

describe('POST /api/jobs', () => {
  it('creates a job when recruiter has a company profile', async () => {
    const { user: recruiter, token } = await createUser('recruiter');
    await createCompany(recruiter._id);
    const res = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Backend Developer',
        description: 'Node.js expert needed',
        location: 'Remote',
        jobType: 'full-time',
        experienceMin: 2,
        experienceMax: 5,
        skills: ['Node.js', 'MongoDB'],
        openings: 1,
      });
    expect(res.status).toBe(201);
    expect(res.body.job.title).toBe('Backend Developer');
    expect(res.body.job.postedBy.toString()).toBe(recruiter._id.toString());
  });

  it('returns 400 when recruiter has no company profile', async () => {
    const { token } = await createUser('recruiter');
    const res = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Dev', description: 'Job', location: 'Delhi', jobType: 'full-time' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/company profile/i);
  });

  it('returns 403 when a candidate tries to post a job', async () => {
    const { token } = await createUser('candidate');
    const res = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Dev' });
    expect(res.status).toBe(403);
  });
});

// ─── GET JOBS ─────────────────────────────────────────────────────────────────

describe('GET /api/jobs', () => {
  it('returns all active jobs', async () => {
    const { user: r, token } = await createUser('recruiter');
    const company = await createCompany(r._id);
    await createJob(r._id, company._id, { title: 'React Dev', location: 'Mumbai' });
    await createJob(r._id, company._id, { title: 'Vue Dev', location: 'Pune' });

    const res = await request(app).get('/api/jobs');
    expect(res.status).toBe(200);
    expect(res.body.jobs.length).toBe(2);
  });

  it('filters jobs by keyword', async () => {
    const { user: r } = await createUser('recruiter');
    const company = await createCompany(r._id);
    await createJob(r._id, company._id, { title: 'React Developer', skills: ['React', 'JavaScript'] });
    await createJob(r._id, company._id, { title: 'DevOps Engineer', skills: ['Docker', 'Kubernetes'] });

    const res = await request(app).get('/api/jobs?keyword=react');
    expect(res.status).toBe(200);
    expect(res.body.jobs.length).toBe(1);
    expect(res.body.jobs[0].title).toMatch(/react/i);
  });

  it('filters jobs by location', async () => {
    const { user: r } = await createUser('recruiter');
    const company = await createCompany(r._id);
    await createJob(r._id, company._id, { location: 'Bengaluru' });
    await createJob(r._id, company._id, { location: 'Delhi' });

    const res = await request(app).get('/api/jobs?location=bengaluru');
    expect(res.status).toBe(200);
    expect(res.body.jobs.every(j => j.location.toLowerCase().includes('bengaluru'))).toBe(true);
  });

  it('filters jobs by jobType', async () => {
    const { user: r } = await createUser('recruiter');
    const company = await createCompany(r._id);
    await createJob(r._id, company._id, { jobType: 'full-time' });
    await createJob(r._id, company._id, { jobType: 'internship' });

    const res = await request(app).get('/api/jobs?jobType=internship');
    expect(res.status).toBe(200);
    expect(res.body.jobs.every(j => j.jobType === 'internship')).toBe(true);
  });

  it('does not return closed/draft jobs', async () => {
    const { user: r } = await createUser('recruiter');
    const company = await createCompany(r._id);
    await createJob(r._id, company._id, { status: 'closed' });
    const res = await request(app).get('/api/jobs');
    expect(res.status).toBe(200);
    expect(res.body.jobs.length).toBe(0);
  });
});

// ─── GET JOB BY ID ────────────────────────────────────────────────────────────

describe('GET /api/jobs/:id', () => {
  it('returns a job by id', async () => {
    const { user: r, token } = await createUser('recruiter');
    const company = await createCompany(r._id);
    const job = await createJob(r._id, company._id);

    const res = await request(app).get(`/api/jobs/${job._id}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.job._id).toBe(job._id.toString());
  });

  it('returns 404 for non-existent job', async () => {
    const { token } = await createUser('candidate');
    const res = await request(app)
      .get('/api/jobs/64a0000000000000000000bb')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

// ─── GET MY JOBS ──────────────────────────────────────────────────────────────

describe('GET /api/jobs/recruiter/my-jobs', () => {
  it("returns recruiter's own jobs", async () => {
    const { user: r, token } = await createUser('recruiter');
    const company = await createCompany(r._id);
    await createJob(r._id, company._id, { title: 'Job 1' });
    await createJob(r._id, company._id, { title: 'Job 2' });

    const res = await request(app).get('/api/jobs/recruiter/my-jobs').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.jobs.length).toBe(2);
  });
});

// ─── UPDATE JOB ───────────────────────────────────────────────────────────────

describe('PUT /api/jobs/:id', () => {
  it('updates a job the recruiter owns', async () => {
    const { user: r, token } = await createUser('recruiter');
    const company = await createCompany(r._id);
    const job = await createJob(r._id, company._id);

    const res = await request(app)
      .put(`/api/jobs/${job._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated Title', openings: 5 });
    expect(res.status).toBe(200);
    expect(res.body.job.title).toBe('Updated Title');
    expect(res.body.job.openings).toBe(5);
  });

  it('returns 404 when recruiter does not own the job', async () => {
    const { user: r1 } = await createUser('recruiter', { email: 'r1@test.com' });
    const { token: token2 } = await createUser('recruiter', { email: 'r2@test.com' });
    const company = await createCompany(r1._id);
    const job = await createJob(r1._id, company._id);

    const res = await request(app)
      .put(`/api/jobs/${job._id}`)
      .set('Authorization', `Bearer ${token2}`)
      .send({ title: 'Hacked' });
    expect(res.status).toBe(404);
  });
});

// ─── DELETE JOB ───────────────────────────────────────────────────────────────

describe('DELETE /api/jobs/:id', () => {
  it('deletes a job the recruiter owns', async () => {
    const { user: r, token } = await createUser('recruiter');
    const company = await createCompany(r._id);
    const job = await createJob(r._id, company._id);

    const res = await request(app)
      .delete(`/api/jobs/${job._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 404 for non-existent or not-owned job', async () => {
    const { token } = await createUser('recruiter');
    const res = await request(app)
      .delete('/api/jobs/64a0000000000000000000cc')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

// ─── UPDATE JOB STATUS ────────────────────────────────────────────────────────

describe('PUT /api/jobs/:id/status', () => {
  it('updates job status to paused', async () => {
    const { user: r, token } = await createUser('recruiter');
    const company = await createCompany(r._id);
    const job = await createJob(r._id, company._id);

    const res = await request(app)
      .put(`/api/jobs/${job._id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'paused' });
    expect(res.status).toBe(200);
    expect(res.body.job.status).toBe('paused');
  });
});

// ─── SAVE / UNSAVE JOB ────────────────────────────────────────────────────────

describe('Save/unsave jobs', () => {
  it('saves a job successfully', async () => {
    const { user: r } = await createUser('recruiter', { email: 'saver_r@test.com' });
    const company = await createCompany(r._id);
    const job = await createJob(r._id, company._id);
    const { token: cToken } = await createUser('candidate', { email: 'saver_c@test.com' });

    const res = await request(app)
      .post(`/api/jobs/${job._id}/save`)
      .set('Authorization', `Bearer ${cToken}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/saved/i);
  });

  it('returns 400 when saving an already-saved job', async () => {
    const { user: r } = await createUser('recruiter', { email: 'dup_r@test.com' });
    const company = await createCompany(r._id);
    const job = await createJob(r._id, company._id);
    const { user: c, token: cToken } = await createUser('candidate', { email: 'dup_c@test.com' });

    await request(app).post(`/api/jobs/${job._id}/save`).set('Authorization', `Bearer ${cToken}`);
    const res = await request(app).post(`/api/jobs/${job._id}/save`).set('Authorization', `Bearer ${cToken}`);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already saved/i);
  });

  it('unsaves a saved job', async () => {
    const { user: r } = await createUser('recruiter', { email: 'un_r@test.com' });
    const company = await createCompany(r._id);
    const job = await createJob(r._id, company._id);
    const { token: cToken } = await createUser('candidate', { email: 'un_c@test.com' });

    await request(app).post(`/api/jobs/${job._id}/save`).set('Authorization', `Bearer ${cToken}`);
    const res = await request(app).delete(`/api/jobs/${job._id}/save`).set('Authorization', `Bearer ${cToken}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/unsaved/i);
  });
});
