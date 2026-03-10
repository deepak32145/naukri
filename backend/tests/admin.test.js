const request = require('supertest');
const app = require('../src/app');
const Job = require('../src/models/Job.model');
const Company = require('../src/models/Company.model');
const User = require('../src/models/User.model');
const { connect, clearDB, disconnect } = require('./setup');
const { createUser, createCompany, createJob } = require('./helpers');

jest.mock('../src/utils/email', () => ({ sendEmail: jest.fn(), emailTemplates: {} }));
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

describe('GET /api/admin/stats', () => {
  it('returns dashboard stats for admin', async () => {
    const { token } = await createUser('admin', { email: 'admin@test.com' });
    await createUser('candidate', { email: 'c@test.com' });
    await createUser('recruiter', { email: 'r@test.com' });

    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.stats).toHaveProperty('totalUsers');
    expect(res.body.stats).toHaveProperty('totalJobs');
    expect(res.body.stats).toHaveProperty('candidates');
    expect(res.body.stats).toHaveProperty('recruiters');
    expect(res.body.stats.candidates).toBe(1);
    expect(res.body.stats.recruiters).toBe(1);
  });

  it('returns 403 for non-admin users', async () => {
    const { token } = await createUser('candidate');
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/admin/stats');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/admin/users', () => {
  it('returns all users with pagination', async () => {
    const { token } = await createUser('admin', { email: 'admin2@test.com' });
    await createUser('candidate', { email: 'u1@test.com' });
    await createUser('recruiter', { email: 'u2@test.com' });

    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.users.length).toBeGreaterThanOrEqual(3); // admin + 2 created
    expect(res.body).toHaveProperty('total');
  });

  it('filters users by role', async () => {
    const { token } = await createUser('admin', { email: 'admin3@test.com' });
    await createUser('candidate', { email: 'fc@test.com' });
    await createUser('recruiter', { email: 'fr@test.com' });

    const res = await request(app)
      .get('/api/admin/users?role=candidate')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.users.every((u) => u.role === 'candidate')).toBe(true);
  });

  it('searches users by name', async () => {
    const { token } = await createUser('admin', { email: 'admin4@test.com' });
    await createUser('candidate', { email: 'john@test.com', name: 'John Doe' });
    await createUser('candidate', { email: 'jane@test.com', name: 'Jane Smith' });

    const res = await request(app)
      .get('/api/admin/users?search=John')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.users.length).toBe(1);
    expect(res.body.users[0].name).toBe('John Doe');
  });
});

describe('PUT /api/admin/users/:id/ban', () => {
  it('bans a user', async () => {
    const { token: adminToken } = await createUser('admin', { email: 'admin5@test.com' });
    const { user } = await createUser('candidate', { email: 'ban@test.com' });

    const res = await request(app)
      .put(`/api/admin/users/${user._id}/ban`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isBanned: true });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.isBanned).toBe(true);
    expect(res.body.message).toMatch(/banned/i);
  });

  it('unbans a user', async () => {
    const { token: adminToken } = await createUser('admin', { email: 'admin6@test.com' });
    const { user } = await createUser('candidate', { email: 'unban@test.com', isBanned: true });

    const res = await request(app)
      .put(`/api/admin/users/${user._id}/ban`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isBanned: false });
    expect(res.status).toBe(200);
    expect(res.body.user.isBanned).toBe(false);
    expect(res.body.message).toMatch(/unbanned/i);
  });

  it('returns 404 for non-existent user', async () => {
    const { token: adminToken } = await createUser('admin', { email: 'admin7@test.com' });
    const fakeId = '507f1f77bcf86cd799439011';

    const res = await request(app)
      .put(`/api/admin/users/${fakeId}/ban`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isBanned: true });
    expect(res.status).toBe(404);
  });
});

describe('GET /api/admin/jobs', () => {
  it('returns all jobs with pagination', async () => {
    const { token: adminToken } = await createUser('admin', { email: 'admin8@test.com' });
    const { user: recruiter } = await createUser('recruiter', { email: 'rec@test.com' });
    const company = await createCompany(recruiter._id);
    await createJob(recruiter._id, company._id, { title: 'React Developer' });
    await createJob(recruiter._id, company._id, { title: 'Node Developer' });

    const res = await request(app)
      .get('/api/admin/jobs')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.jobs.length).toBe(2);
    expect(res.body).toHaveProperty('total');
  });

  it('filters jobs by status', async () => {
    const { token: adminToken } = await createUser('admin', { email: 'admin9@test.com' });
    const { user: recruiter } = await createUser('recruiter', { email: 'rec2@test.com' });
    const company = await createCompany(recruiter._id);
    await createJob(recruiter._id, company._id, { status: 'active' });
    await createJob(recruiter._id, company._id, { status: 'closed' });

    const res = await request(app)
      .get('/api/admin/jobs?status=active')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.jobs.every((j) => j.status === 'active')).toBe(true);
  });

  it('searches jobs by title', async () => {
    const { token: adminToken } = await createUser('admin', { email: 'admin10@test.com' });
    const { user: recruiter } = await createUser('recruiter', { email: 'rec3@test.com' });
    const company = await createCompany(recruiter._id);
    await createJob(recruiter._id, company._id, { title: 'Senior React Developer' });
    await createJob(recruiter._id, company._id, { title: 'Backend Python Engineer' });

    const res = await request(app)
      .get('/api/admin/jobs?search=React')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.jobs.length).toBe(1);
    expect(res.body.jobs[0].title).toBe('Senior React Developer');
  });
});

describe('DELETE /api/admin/jobs/:id', () => {
  it('deletes a job', async () => {
    const { token: adminToken } = await createUser('admin', { email: 'admin11@test.com' });
    const { user: recruiter } = await createUser('recruiter', { email: 'rec4@test.com' });
    const company = await createCompany(recruiter._id);
    const job = await createJob(recruiter._id, company._id);

    const res = await request(app)
      .delete(`/api/admin/jobs/${job._id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const deleted = await Job.findById(job._id);
    expect(deleted).toBeNull();
  });

  it('returns 403 when a non-admin tries to delete', async () => {
    const { user: recruiter, token: recruiterToken } = await createUser('recruiter', { email: 'rec5@test.com' });
    const company = await createCompany(recruiter._id);
    const job = await createJob(recruiter._id, company._id);

    const res = await request(app)
      .delete(`/api/admin/jobs/${job._id}`)
      .set('Authorization', `Bearer ${recruiterToken}`);
    expect(res.status).toBe(403);

    const stillExists = await Job.findById(job._id);
    expect(stillExists).not.toBeNull();
  });
});

describe('PUT /api/admin/companies/:id/verify', () => {
  it('verifies a company', async () => {
    const { token: adminToken } = await createUser('admin', { email: 'admin12@test.com' });
    const { user: recruiter } = await createUser('recruiter', { email: 'rec6@test.com' });
    const company = await createCompany(recruiter._id, { isVerified: false });

    const res = await request(app)
      .put(`/api/admin/companies/${company._id}/verify`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.company.isVerified).toBe(true);
  });

  it('returns 404 for a non-existent company', async () => {
    const { token: adminToken } = await createUser('admin', { email: 'admin13@test.com' });
    const fakeId = '507f1f77bcf86cd799439011';

    const res = await request(app)
      .put(`/api/admin/companies/${fakeId}/verify`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });

  it('returns 403 when non-admin tries to verify company', async () => {
    const { user: recruiter, token: recruiterToken } = await createUser('recruiter', { email: 'rec7@test.com' });
    const company = await createCompany(recruiter._id);

    const res = await request(app)
      .put(`/api/admin/companies/${company._id}/verify`)
      .set('Authorization', `Bearer ${recruiterToken}`);
    expect(res.status).toBe(403);
  });
});
