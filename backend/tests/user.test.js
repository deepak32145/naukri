const request = require('supertest');
const app = require('../src/app');
const { connect, clearDB, disconnect } = require('./setup');
const { createUser, createCompany } = require('./helpers');

jest.mock('../src/utils/email', () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
  emailTemplates: {
    verifyEmail: jest.fn().mockReturnValue({ subject: 'Verify', html: '' }),
  },
}));

jest.mock('../src/config/cloudinary', () => ({
  cloudinary: { uploader: { destroy: jest.fn().mockResolvedValue({ result: 'ok' }) } },
  uploadAvatar: { single: () => (req, res, next) => next() },
  uploadResume: { single: () => (req, res, next) => next() },
  uploadLogo: { single: () => (req, res, next) => next() },
}));

// Expose onlineUsers so we can manipulate it in tests
const { onlineUsers } = require('../src/utils/socket');
jest.mock('../src/utils/socket', () => {
  const map = new Map();
  return { initSocket: jest.fn(), onlineUsers: map };
});

beforeAll(async () => { await connect(); });
afterEach(async () => {
  await clearDB();
  onlineUsers.clear();
});
afterAll(async () => { await disconnect(); });

// ─── GET ME ───────────────────────────────────────────────────────────────────

describe('GET /api/users/me', () => {
  it('returns user and profile for candidate', async () => {
    const { token } = await createUser('candidate');
    const res = await request(app).get('/api/users/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.profile).toBeDefined();
  });

  it('returns user (no profile) for recruiter', async () => {
    const { token } = await createUser('recruiter');
    const res = await request(app).get('/api/users/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.profile).toBeNull();
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/users/me');
    expect(res.status).toBe(401);
  });
});

// ─── UPDATE ME ────────────────────────────────────────────────────────────────

describe('PUT /api/users/me', () => {
  it('updates name and phone', async () => {
    const { token } = await createUser('candidate');
    const res = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Name', phone: '9999999999' });
    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('Updated Name');
    expect(res.body.user.phone).toBe('9999999999');
  });
});

// ─── GET USER BY ID ───────────────────────────────────────────────────────────

describe('GET /api/users/:id', () => {
  it('returns public profile by id', async () => {
    const { user, token } = await createUser('candidate');
    const { token: rToken } = await createUser('recruiter');
    const res = await request(app)
      .get(`/api/users/${user._id}`)
      .set('Authorization', `Bearer ${rToken}`);
    expect(res.status).toBe(200);
    expect(res.body.user._id).toBe(user._id.toString());
    // Password should not be in response
    expect(res.body.user.password).toBeUndefined();
  });

  it('returns 404 for non-existent user', async () => {
    const { token } = await createUser('recruiter');
    const fakeId = '64a0000000000000000000aa';
    const res = await request(app)
      .get(`/api/users/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

// ─── SEARCH CANDIDATES (recruiter only) ───────────────────────────────────────

describe('GET /api/users (search candidates)', () => {
  it('returns candidates when called by a recruiter', async () => {
    await createUser('candidate', { email: 'c1@test.com' });
    const { token: rToken } = await createUser('recruiter');
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${rToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.profiles)).toBe(true);
  });

  it('returns 403 for candidates trying to search candidates', async () => {
    const { token } = await createUser('candidate');
    const res = await request(app).get('/api/users').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

// ─── ONLINE RECRUITERS ────────────────────────────────────────────────────────

describe('GET /api/users/online-recruiters', () => {
  it('returns empty array when no recruiters are online', async () => {
    const { token } = await createUser('candidate');
    const res = await request(app)
      .get('/api/users/online-recruiters')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.recruiters).toEqual([]);
  });

  it('returns online recruiters with company info', async () => {
    const { user: recruiter, token: cToken } = await createUser('recruiter');
    const { token } = await createUser('candidate');
    // Mark recruiter as online
    onlineUsers.set(recruiter._id.toString(), 'fake-socket-id');
    await createCompany(recruiter._id, { name: 'TechCorp' });

    const res = await request(app)
      .get('/api/users/online-recruiters')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.recruiters.length).toBe(1);
    expect(res.body.recruiters[0].isOnline).toBe(true);
    expect(res.body.recruiters[0].company.name).toBe('TechCorp');
  });

  it('does not include offline recruiters', async () => {
    await createUser('recruiter'); // not added to onlineUsers
    const { token } = await createUser('candidate');
    const res = await request(app)
      .get('/api/users/online-recruiters')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.recruiters.length).toBe(0);
  });
});
