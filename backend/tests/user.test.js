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
  uploadAvatar: { single: () => (req, res, next) => {
    req.file = { path: 'http://cloudinary.com/avatar.jpg', filename: 'avatar_123', originalname: 'avatar.jpg' };
    next();
  }},
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

// ─── UPDATE AVATAR ────────────────────────────────────────────────────────────

describe('PUT /api/users/me/avatar', () => {
  it('uploads avatar successfully', async () => {
    const { token } = await createUser('candidate');
    const res = await request(app)
      .put('/api/users/me/avatar')
      .set('Authorization', `Bearer ${token}`)
      .attach('avatar', Buffer.from('fake image data'), 'avatar.jpg');
    expect(res.status).toBe(200);
    expect(res.body.avatar.url).toBe('http://cloudinary.com/avatar.jpg');
  });

  it('returns 401 without token', async () => {
    const res = await request(app)
      .put('/api/users/me/avatar')
      .attach('avatar', Buffer.from('fake image data'), 'avatar.jpg');
    expect(res.status).toBe(401);
  });
});

// ─── DELETE ACCOUNT ───────────────────────────────────────────────────────────

describe('DELETE /api/users/me', () => {
  it('deletes the user account', async () => {
    const { user, token } = await createUser('candidate');
    const User = require('../src/models/User.model');
    const res = await request(app)
      .delete('/api/users/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
    const deleted = await User.findById(user._id);
    expect(deleted).toBeNull();
  });

  it('returns 401 without token', async () => {
    const res = await request(app).delete('/api/users/me');
    expect(res.status).toBe(401);
  });
});

// ─── GET USER BY ID — profile view logging ────────────────────────────────────

describe('GET /api/users/:id — profile view logging', () => {
  it('logs profile view in DB when a recruiter views a candidate', async () => {
    const CandidateProfile = require('../src/models/CandidateProfile.model');
    const { user: candidate } = await createUser('candidate', { email: 'pv_cand@test.com' });
    const { user: recruiter, token: rToken } = await createUser('recruiter', { email: 'pv_rec@test.com' });

    await request(app)
      .get(`/api/users/${candidate._id}`)
      .set('Authorization', `Bearer ${rToken}`);

    const profile = await CandidateProfile.findOne({ userId: candidate._id });
    expect(profile.profileViews).toHaveLength(1);
    expect(profile.profileViews[0].viewedBy.toString()).toBe(recruiter._id.toString());
  });

  it('does NOT log a view when a candidate views their own profile', async () => {
    const CandidateProfile = require('../src/models/CandidateProfile.model');
    const { user: candidate, token } = await createUser('candidate', { email: 'pv_own@test.com' });

    await request(app)
      .get(`/api/users/${candidate._id}`)
      .set('Authorization', `Bearer ${token}`);

    const profile = await CandidateProfile.findOne({ userId: candidate._id });
    expect(profile.profileViews).toHaveLength(0);
  });

  it('does not expose jobAlerts or profileViews in the public profile response', async () => {
    const { user: candidate } = await createUser('candidate', { email: 'pv_priv@test.com' });
    const { token: rToken } = await createUser('recruiter', { email: 'pv_priv_r@test.com' });

    const res = await request(app)
      .get(`/api/users/${candidate._id}`)
      .set('Authorization', `Bearer ${rToken}`);

    expect(res.status).toBe(200);
    expect(res.body.profile?.profileViews).toBeUndefined();
    expect(res.body.profile?.jobAlerts).toBeUndefined();
  });

  it('does not return profile for non-candidate user', async () => {
    const { user: recruiter } = await createUser('recruiter', { email: 'pv_norec@test.com' });
    const { token } = await createUser('candidate', { email: 'pv_viewer@test.com' });

    const res = await request(app)
      .get(`/api/users/${recruiter._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.profile).toBeNull();
  });

  it('returns 404 for non-existent user id', async () => {
    const { token } = await createUser('recruiter', { email: 'pv_404@test.com' });
    const res = await request(app)
      .get('/api/users/64a0000000000000000000ff')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

// ─── SEARCH CANDIDATES — advanced filters ────────────────────────────────────

describe('GET /api/users — search candidates with filters', () => {
  it('filters candidates by skills', async () => {
    const { user: c1 } = await createUser('candidate', { email: 'sf_c1@test.com' });
    const CandidateProfile = require('../src/models/CandidateProfile.model');
    await CandidateProfile.findOneAndUpdate({ userId: c1._id }, { skills: ['Python'] });

    const { token: rToken } = await createUser('recruiter', { email: 'sf_r@test.com' });
    const res = await request(app)
      .get('/api/users?skills=Python')
      .set('Authorization', `Bearer ${rToken}`);
    expect(res.status).toBe(200);
    expect(res.body.profiles.length).toBeGreaterThanOrEqual(1);
  });

  it('filters candidates by location', async () => {
    const { user: c } = await createUser('candidate', { email: 'loc_c@test.com' });
    const CandidateProfile = require('../src/models/CandidateProfile.model');
    await CandidateProfile.findOneAndUpdate({ userId: c._id }, { currentLocation: 'Bengaluru' });

    const { token: rToken } = await createUser('recruiter', { email: 'loc_r@test.com' });
    const res = await request(app)
      .get('/api/users?location=Bengaluru')
      .set('Authorization', `Bearer ${rToken}`);
    expect(res.status).toBe(200);
    expect(res.body.profiles.every(p => /bengaluru/i.test(p.currentLocation))).toBe(true);
  });

  it('filters candidates by experience range', async () => {
    const { user: c } = await createUser('candidate', { email: 'exp_c@test.com' });
    const CandidateProfile = require('../src/models/CandidateProfile.model');
    await CandidateProfile.findOneAndUpdate({ userId: c._id }, { experienceYears: 5 });

    const { token: rToken } = await createUser('recruiter', { email: 'exp_r@test.com' });
    const res = await request(app)
      .get('/api/users?experienceMin=4&experienceMax=8')
      .set('Authorization', `Bearer ${rToken}`);
    expect(res.status).toBe(200);
    expect(res.body.profiles.every(p => p.experienceYears >= 4 && p.experienceYears <= 8)).toBe(true);
  });

  it('filters candidates by keyword (headline/summary)', async () => {
    const { user: c } = await createUser('candidate', { email: 'kw_c@test.com' });
    const CandidateProfile = require('../src/models/CandidateProfile.model');
    await CandidateProfile.findOneAndUpdate({ userId: c._id }, { headline: 'Senior Node.js Developer' });

    const { token: rToken } = await createUser('recruiter', { email: 'kw_r@test.com' });
    const res = await request(app)
      .get('/api/users?keyword=Senior')
      .set('Authorization', `Bearer ${rToken}`);
    expect(res.status).toBe(200);
  });
});
