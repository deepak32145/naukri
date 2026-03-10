const request = require('supertest');
const app = require('../src/app');
const { connect, clearDB, disconnect } = require('./setup');
const { createUser } = require('./helpers');
const jwt = require('jsonwebtoken');

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

// We test the middleware via real endpoints that use protect / restrictTo
describe('protect middleware', () => {
  it('allows access with a valid token', async () => {
    const { token } = await createUser('candidate');
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('returns 401 when no token is provided', async () => {
    const res = await request(app).get('/api/users/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 when token is malformed', async () => {
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', 'Bearer totally.invalid.token');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 when token is signed with wrong secret', async () => {
    const badToken = jwt.sign({ id: '507f1f77bcf86cd799439011' }, 'wrong_secret', { expiresIn: '1d' });
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${badToken}`);
    expect(res.status).toBe(401);
  });

  it('returns 401 when user referenced in token no longer exists', async () => {
    // Generate a token for a non-existent user ID
    const fakeToken = jwt.sign({ id: '507f1f77bcf86cd799439011' }, process.env.JWT_SECRET, { expiresIn: '1d' });
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${fakeToken}`);
    expect(res.status).toBe(401);
  });

  it('returns 403 when user account is banned', async () => {
    const { token } = await createUser('candidate', { isBanned: true });
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/banned/i);
  });
});

describe('restrictTo middleware', () => {
  it('allows access when user has the correct role', async () => {
    const { user: recruiter, token } = await createUser('recruiter', { email: 'r@test.com' });
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`);
    // searchCandidates is recruiter/admin only — should succeed
    expect(res.status).toBe(200);
  });

  it('returns 403 when user does not have the required role', async () => {
    const { token } = await createUser('candidate', { email: 'notrecruiter@test.com' });
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/access denied/i);
  });

  it('returns 403 when candidate tries to access admin routes', async () => {
    const { token } = await createUser('candidate', { email: 'notadmin@test.com' });
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('returns 403 when recruiter tries to access admin routes', async () => {
    const { token } = await createUser('recruiter', { email: 'recradmin@test.com' });
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('allows admin to access admin routes', async () => {
    const { token } = await createUser('admin', { email: 'admin@test.com' });
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});
