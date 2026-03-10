const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User.model');
const CandidateProfile = require('../src/models/CandidateProfile.model');
const { connect, clearDB, disconnect } = require('./setup');
const { createUser } = require('./helpers');

// Mock email so no real emails are sent
jest.mock('../src/utils/email', () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
  emailTemplates: {
    verifyEmail: jest.fn().mockReturnValue({ subject: 'Verify', html: '<p>OTP</p>' }),
    passwordReset: jest.fn().mockReturnValue({ subject: 'Reset', html: '<p>OTP</p>' }),
  },
}));

// Mock socket so no real WS server is needed
jest.mock('../src/utils/socket', () => ({
  initSocket: jest.fn(),
  onlineUsers: new Map(),
}));

// Mock cloudinary so no real uploads happen
jest.mock('../src/config/cloudinary', () => ({
  cloudinary: { uploader: { destroy: jest.fn().mockResolvedValue({ result: 'ok' }) } },
  uploadAvatar: { single: () => (req, res, next) => next() },
  uploadResume: { single: () => (req, res, next) => next() },
  uploadLogo: { single: () => (req, res, next) => next() },
}));

beforeAll(async () => { await connect(); });
afterEach(async () => { await clearDB(); });
afterAll(async () => { await disconnect(); });

// ─── REGISTER ────────────────────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  it('registers a new candidate successfully', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Alice', email: 'alice@test.com', password: 'password123', role: 'candidate',
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('candidate');
  });

  it('creates a CandidateProfile when role is candidate', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Bob', email: 'bob@test.com', password: 'password123', role: 'candidate',
    });
    const user = await User.findOne({ email: 'bob@test.com' });
    const profile = await CandidateProfile.findOne({ userId: user._id });
    expect(profile).not.toBeNull();
  });

  it('registers a recruiter without creating CandidateProfile', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Corp HR', email: 'hr@corp.com', password: 'password123', role: 'recruiter',
    });
    expect(res.status).toBe(201);
    const user = await User.findOne({ email: 'hr@corp.com' });
    const profile = await CandidateProfile.findOne({ userId: user._id });
    expect(profile).toBeNull();
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'missing@test.com', password: 'password123',
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when email is already registered', async () => {
    await createUser('candidate', { email: 'dup@test.com' });
    const res = await request(app).post('/api/auth/register').send({
      name: 'Dup', email: 'dup@test.com', password: 'password123', role: 'candidate',
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already registered/i);
  });

  it('returns 400 for invalid role', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Admin', email: 'admin@test.com', password: 'password123', role: 'superadmin',
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/role must be/i);
  });
});

// ─── LOGIN ────────────────────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  it('logs in successfully with valid credentials', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Charlie', email: 'charlie@test.com', password: 'password123', role: 'candidate',
    });
    const res = await request(app).post('/api/auth/login').send({
      email: 'charlie@test.com', password: 'password123',
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('charlie@test.com');
  });

  it('returns 400 when email or password is missing', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'test@test.com' });
    expect(res.status).toBe(400);
  });

  it('returns 401 for non-existent email', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'nobody@test.com', password: 'password123',
    });
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid credentials/i);
  });

  it('returns 401 for wrong password', async () => {
    await createUser('candidate', { email: 'wrongpass@test.com' });
    const res = await request(app).post('/api/auth/login').send({
      email: 'wrongpass@test.com', password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
  });

  it('returns 403 for banned user', async () => {
    const { user } = await createUser('candidate', { email: 'banned@test.com' });
    await User.findByIdAndUpdate(user._id, { isBanned: true });
    const res = await request(app).post('/api/auth/login').send({
      email: 'banned@test.com', password: 'password123',
    });
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/banned/i);
  });
});

// ─── LOGOUT ───────────────────────────────────────────────────────────────────

describe('POST /api/auth/logout', () => {
  it('logs out successfully with a valid token', async () => {
    const { token } = await createUser('candidate');
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(401);
  });
});

// ─── VERIFY EMAIL ─────────────────────────────────────────────────────────────

describe('POST /api/auth/verify-email', () => {
  it('verifies email with correct OTP', async () => {
    const otp = '123456';
    const { user, token } = await createUser('candidate', {
      isEmailVerified: false,
    });
    // Set OTP directly in DB
    await User.collection.updateOne(
      { _id: user._id },
      { $set: { otp: { code: otp, expiresAt: new Date(Date.now() + 600000), type: 'email_verification' } } }
    );
    const res = await request(app)
      .post('/api/auth/verify-email')
      .set('Authorization', `Bearer ${token}`)
      .send({ otp });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 400 for wrong OTP', async () => {
    const { user, token } = await createUser('candidate', { isEmailVerified: false });
    await User.collection.updateOne(
      { _id: user._id },
      { $set: { otp: { code: '999999', expiresAt: new Date(Date.now() + 600000), type: 'email_verification' } } }
    );
    const res = await request(app)
      .post('/api/auth/verify-email')
      .set('Authorization', `Bearer ${token}`)
      .send({ otp: '000000' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid otp/i);
  });

  it('returns 400 for expired OTP', async () => {
    const { user, token } = await createUser('candidate', { isEmailVerified: false });
    await User.collection.updateOne(
      { _id: user._id },
      { $set: { otp: { code: '123456', expiresAt: new Date(Date.now() - 1000), type: 'email_verification' } } }
    );
    const res = await request(app)
      .post('/api/auth/verify-email')
      .set('Authorization', `Bearer ${token}`)
      .send({ otp: '123456' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/expired/i);
  });
});

// ─── FORGOT PASSWORD ──────────────────────────────────────────────────────────

describe('POST /api/auth/forgot-password', () => {
  it('sends reset OTP for existing email', async () => {
    await createUser('candidate', { email: 'forgotme@test.com' });
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'forgotme@test.com' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 404 for unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'nobody@test.com' });
    expect(res.status).toBe(404);
  });
});

// ─── RESET PASSWORD ───────────────────────────────────────────────────────────

describe('POST /api/auth/reset-password', () => {
  it('resets password with valid OTP', async () => {
    const { user } = await createUser('candidate', { email: 'reset@test.com' });
    const otp = '654321';
    await User.collection.updateOne(
      { _id: user._id },
      { $set: { otp: { code: otp, expiresAt: new Date(Date.now() + 600000), type: 'password_reset' } } }
    );
    const res = await request(app).post('/api/auth/reset-password').send({
      email: 'reset@test.com', otp, newPassword: 'newpassword123',
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // Verify new password works
    const login = await request(app).post('/api/auth/login').send({
      email: 'reset@test.com', password: 'newpassword123',
    });
    expect(login.status).toBe(200);
  });

  it('returns 400 for wrong OTP', async () => {
    const { user } = await createUser('candidate', { email: 'wrongotp@test.com' });
    await User.collection.updateOne(
      { _id: user._id },
      { $set: { otp: { code: '111111', expiresAt: new Date(Date.now() + 600000), type: 'password_reset' } } }
    );
    const res = await request(app).post('/api/auth/reset-password').send({
      email: 'wrongotp@test.com', otp: '000000', newPassword: 'new123',
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid otp/i);
  });
});
