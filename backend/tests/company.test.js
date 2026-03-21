const request = require('supertest');
const app = require('../src/app');
const Company = require('../src/models/Company.model');
const Review = require('../src/models/Review.model');
const { connect, clearDB, disconnect } = require('./setup');
const { createUser, createCompany } = require('./helpers');

jest.mock('../src/utils/email', () => ({ sendEmail: jest.fn(), emailTemplates: {} }));
jest.mock('../src/utils/socket', () => ({ initSocket: jest.fn(), onlineUsers: new Map() }));
jest.mock('../src/config/cloudinary', () => ({
  cloudinary: { uploader: { destroy: jest.fn() } },
  uploadAvatar: { single: () => (req, res, next) => next() },
  uploadResume: { single: () => (req, res, next) => next() },
  uploadLogo: { single: () => (req, res, next) => {
    req.file = { path: 'http://cloudinary.com/logo.png', filename: 'logo_123', originalname: 'logo.png' };
    next();
  }},
}));

beforeAll(async () => { await connect(); });
afterEach(async () => { await clearDB(); });
afterAll(async () => { await disconnect(); });

// ─── POST /api/companies ──────────────────────────────────────────────────────

describe('POST /api/companies', () => {
  it('creates a company for a recruiter', async () => {
    const { token } = await createUser('recruiter');
    const res = await request(app)
      .post('/api/companies')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Acme Corp', industry: 'Information Technology', location: 'Delhi' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.company.name).toBe('Acme Corp');
  });

  it('rejects if recruiter already has a company', async () => {
    const { user, token } = await createUser('recruiter');
    await createCompany(user._id);
    const res = await request(app)
      .post('/api/companies')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Another Corp', industry: 'Finance & Banking', location: 'Mumbai' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already have a company/i);
  });

  it('returns 401 without auth token', async () => {
    const res = await request(app)
      .post('/api/companies')
      .send({ name: 'No Auth Corp' });
    expect(res.status).toBe(401);
  });
});

// ─── GET /api/companies/my ────────────────────────────────────────────────────

describe('GET /api/companies/my', () => {
  it('returns the recruiter\'s own company', async () => {
    const { user, token } = await createUser('recruiter');
    await createCompany(user._id, { name: 'My Corp' });
    const res = await request(app)
      .get('/api/companies/my')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.company.name).toBe('My Corp');
  });

  it('returns null company if recruiter has no company', async () => {
    const { token } = await createUser('recruiter');
    const res = await request(app)
      .get('/api/companies/my')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.company).toBeNull();
  });
});

// ─── GET /api/companies/:id ───────────────────────────────────────────────────

describe('GET /api/companies/:id', () => {
  it('returns company by ID', async () => {
    const { user } = await createUser('recruiter');
    const company = await createCompany(user._id, { name: 'Public Corp' });
    const res = await request(app).get(`/api/companies/${company._id}`);
    expect(res.status).toBe(200);
    expect(res.body.company.name).toBe('Public Corp');
  });

  it('returns 404 for unknown company', async () => {
    const fakeId = '507f1f77bcf86cd799439011';
    const res = await request(app).get(`/api/companies/${fakeId}`);
    expect(res.status).toBe(404);
  });
});

// ─── PUT /api/companies/:id ───────────────────────────────────────────────────

describe('PUT /api/companies/:id', () => {
  it('allows recruiter to update their company', async () => {
    const { user, token } = await createUser('recruiter');
    const company = await createCompany(user._id, { name: 'Old Name' });
    const res = await request(app)
      .put(`/api/companies/${company._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'New Name', industry: 'Healthcare', location: 'Chennai' });
    expect(res.status).toBe(200);
    expect(res.body.company.name).toBe('New Name');
  });

  it('returns 404 if recruiter tries to update another\'s company', async () => {
    const { user: owner } = await createUser('recruiter', { email: 'owner@test.com' });
    const { token: otherToken } = await createUser('recruiter', { email: 'other@test.com' });
    const company = await createCompany(owner._id);
    const res = await request(app)
      .put(`/api/companies/${company._id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ name: 'Hijacked' });
    expect(res.status).toBe(404);
  });
});

// ─── POST /api/companies/:id/logo ─────────────────────────────────────────────

describe('POST /api/companies/:id/logo', () => {
  it('uploads a logo for company', async () => {
    const { user, token } = await createUser('recruiter');
    const company = await createCompany(user._id);
    const res = await request(app)
      .post(`/api/companies/${company._id}/logo`)
      .set('Authorization', `Bearer ${token}`)
      .attach('logo', Buffer.from('fake image'), 'logo.png');
    expect(res.status).toBe(200);
    expect(res.body.logo.url).toBe('http://cloudinary.com/logo.png');
  });

  it('returns 404 if company not found for logo upload', async () => {
    const { token } = await createUser('recruiter');
    const fakeId = '507f1f77bcf86cd799439011';
    const res = await request(app)
      .post(`/api/companies/${fakeId}/logo`)
      .set('Authorization', `Bearer ${token}`)
      .attach('logo', Buffer.from('fake image'), 'logo.png');
    expect(res.status).toBe(404);
  });
});

// ─── GET /api/companies/:id/reviews ──────────────────────────────────────────

describe('GET /api/companies/:id/reviews', () => {
  it('returns reviews for a company', async () => {
    const { user: recruiter } = await createUser('recruiter', { email: 'rec@test.com' });
    const { user: candidate } = await createUser('candidate', { email: 'cand@test.com' });
    const company = await createCompany(recruiter._id);
    await Review.create({ companyId: company._id, candidateId: candidate._id, rating: 4, title: 'Good place' });

    const res = await request(app).get(`/api/companies/${company._id}/reviews`);
    expect(res.status).toBe(200);
    expect(res.body.reviews).toHaveLength(1);
    expect(res.body.reviews[0].title).toBe('Good place');
  });

  it('hides candidate name for anonymous reviews', async () => {
    const { user: recruiter } = await createUser('recruiter', { email: 'rec2@test.com' });
    const { user: candidate } = await createUser('candidate', { email: 'cand2@test.com' });
    const company = await createCompany(recruiter._id);
    await Review.create({
      companyId: company._id, candidateId: candidate._id,
      rating: 3, title: 'Anon review', isAnonymous: true,
    });

    const res = await request(app).get(`/api/companies/${company._id}/reviews`);
    expect(res.status).toBe(200);
    expect(res.body.reviews[0].candidateId.name).toBe('Anonymous');
  });

  it('returns empty array for company with no reviews', async () => {
    const { user } = await createUser('recruiter');
    const company = await createCompany(user._id);
    const res = await request(app).get(`/api/companies/${company._id}/reviews`);
    expect(res.status).toBe(200);
    expect(res.body.reviews).toHaveLength(0);
  });
});

// ─── POST /api/companies/:id/reviews ─────────────────────────────────────────

describe('POST /api/companies/:id/reviews', () => {
  it('allows a candidate to add a review', async () => {
    const { user: recruiter } = await createUser('recruiter', { email: 'rec3@test.com' });
    const { token } = await createUser('candidate', { email: 'cand3@test.com' });
    const company = await createCompany(recruiter._id);

    const res = await request(app)
      .post(`/api/companies/${company._id}/reviews`)
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 5, title: 'Great!', pros: 'Good culture', cons: 'Long hours' });
    expect(res.status).toBe(201);
    expect(res.body.review.rating).toBe(5);
  });

  it('updates company rating after review', async () => {
    const { user: recruiter } = await createUser('recruiter', { email: 'rec4@test.com' });
    const { token } = await createUser('candidate', { email: 'cand4@test.com' });
    const company = await createCompany(recruiter._id);

    await request(app)
      .post(`/api/companies/${company._id}/reviews`)
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 4, title: 'Nice' });

    const updated = await Company.findById(company._id);
    expect(updated.rating).toBe(4);
    expect(updated.reviewCount).toBe(1);
  });

  it('prevents duplicate review from same candidate', async () => {
    const { user: recruiter } = await createUser('recruiter', { email: 'rec5@test.com' });
    const { user: candidate, token } = await createUser('candidate', { email: 'cand5@test.com' });
    const company = await createCompany(recruiter._id);
    await Review.create({ companyId: company._id, candidateId: candidate._id, rating: 3, title: 'First' });

    const res = await request(app)
      .post(`/api/companies/${company._id}/reviews`)
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 2, title: 'Second' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already reviewed/i);
  });
});

// ─── GET /api/companies ───────────────────────────────────────────────────────

describe('GET /api/companies', () => {
  it('returns list of companies', async () => {
    const { user: r1 } = await createUser('recruiter', { email: 'r1@test.com' });
    const { user: r2 } = await createUser('recruiter', { email: 'r2@test.com' });
    await createCompany(r1._id, { name: 'TechCorp', industry: 'Information Technology' });
    await createCompany(r2._id, { name: 'HealthInc', industry: 'Healthcare' });

    const res = await request(app).get('/api/companies');
    expect(res.status).toBe(200);
    expect(res.body.companies.length).toBeGreaterThanOrEqual(2);
    expect(res.body.total).toBeGreaterThanOrEqual(2);
  });

  it('filters companies by keyword', async () => {
    const { user } = await createUser('recruiter');
    await createCompany(user._id, { name: 'UniqueNameXYZ' });

    const res = await request(app).get('/api/companies?keyword=UniqueNameXYZ');
    expect(res.status).toBe(200);
    expect(res.body.companies).toHaveLength(1);
    expect(res.body.companies[0].name).toBe('UniqueNameXYZ');
  });

  it('filters companies by industry', async () => {
    const { user: r1 } = await createUser('recruiter', { email: 'ri1@test.com' });
    const { user: r2 } = await createUser('recruiter', { email: 'ri2@test.com' });
    await createCompany(r1._id, { industry: 'Healthcare' });
    await createCompany(r2._id, { industry: 'Information Technology' });

    const res = await request(app).get('/api/companies?industry=Healthcare');
    expect(res.status).toBe(200);
    expect(res.body.companies.every(c => /healthcare/i.test(c.industry))).toBe(true);
  });

  it('paginates results', async () => {
    const { user } = await createUser('recruiter');
    await createCompany(user._id, { name: 'PagCorp1' });

    const res = await request(app).get('/api/companies?page=1&limit=1');
    expect(res.status).toBe(200);
    expect(res.body.companies.length).toBeLessThanOrEqual(1);
    expect(res.body.page).toBe(1);
  });
});
