const express = require('express');
const request = require('supertest');

const mockAuthenticate = jest.fn();

jest.mock('../src/config/passport', () => ({
  authenticate: (...args) => mockAuthenticate(...args),
}));

jest.mock('../src/controllers/auth.controller', () => ({
  register: (req, res) => res.status(201).json({ ok: true }),
  login: (req, res) => res.status(200).json({ ok: true }),
  logout: (req, res) => res.status(200).json({ ok: true }),
  verifyEmail: (req, res) => res.status(200).json({ ok: true }),
  resendOtp: (req, res) => res.status(200).json({ ok: true }),
  forgotPassword: (req, res) => res.status(200).json({ ok: true }),
  resetPassword: (req, res) => res.status(200).json({ ok: true }),
  googleCallback: (req, res) => res.status(200).json({ ok: true }),
}));

jest.mock('../src/middleware/auth.middleware', () => ({
  protect: (req, res, next) => next(),
}));

describe('auth.routes google oauth', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    mockAuthenticate.mockImplementation(() => (req, res, next) => {
      if (next) return next();
      return res.status(200).json({ ok: true });
    });
    app = express();
    app.use('/api/auth', require('../src/routes/auth.routes'));
  });

  it('uses default candidate state for /google', async () => {
    const res = await request(app).get('/api/auth/google');
    expect(res.status).toBe(200);
    expect(mockAuthenticate).toHaveBeenCalledWith('google', { scope: ['profile', 'email'], state: 'candidate' });
  });

  it('uses query-provided state for /google', async () => {
    const res = await request(app).get('/api/auth/google?state=recruiter');
    expect(res.status).toBe(200);
    expect(mockAuthenticate).toHaveBeenCalledWith('google', { scope: ['profile', 'email'], state: 'recruiter' });
  });

  it('wires google callback authenticate options', async () => {
    const res = await request(app).get('/api/auth/google/callback');
    expect(res.status).toBe(200);
    expect(mockAuthenticate).toHaveBeenCalledWith(
      'google',
      expect.objectContaining({
        session: false,
        failureRedirect: expect.stringContaining('/login'),
      })
    );
  });
});
