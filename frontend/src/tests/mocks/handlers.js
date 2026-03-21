import { http, HttpResponse } from 'msw';

const BASE = 'http://localhost:5000/api';

export const handlers = [
  // Auth
  http.post(`${BASE}/auth/login`, async ({ request }) => {
    const { email, password } = await request.json();
    if (email === 'candidate@test.com' && password === 'password123') {
      return HttpResponse.json({
        success: true,
        token: 'mock-candidate-token',
        user: { _id: 'u1', name: 'Test Candidate', email, role: 'candidate' },
      });
    }
    if (email === 'recruiter@test.com' && password === 'password123') {
      return HttpResponse.json({
        success: true,
        token: 'mock-recruiter-token',
        user: { _id: 'u2', name: 'Test Recruiter', email, role: 'recruiter' },
      });
    }
    return HttpResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
  }),

  http.post(`${BASE}/auth/register`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      success: true,
      token: 'mock-token',
      user: { _id: 'u3', name: body.name, email: body.email, role: body.role },
    });
  }),

  http.post(`${BASE}/auth/logout`, () => {
    return HttpResponse.json({ success: true });
  }),

  http.post(`${BASE}/auth/forgot-password`, async ({ request }) => {
    const { email } = await request.json();
    return HttpResponse.json({ success: true, message: 'OTP sent to your email' });
  }),

  http.post(`${BASE}/auth/reset-password`, async ({ request }) => {
    const { otp } = await request.json();
    if (otp === '123456') {
      return HttpResponse.json({ success: true, message: 'Password reset successfully' });
    }
    return HttpResponse.json({ success: false, message: 'Invalid OTP' }, { status: 400 });
  }),

  http.post(`${BASE}/auth/verify-email`, async ({ request }) => {
    const { otp } = await request.json();
    if (otp === '123456') {
      return HttpResponse.json({ success: true, message: 'Email verified' });
    }
    return HttpResponse.json({ success: false, message: 'Invalid OTP' }, { status: 400 });
  }),

  http.post(`${BASE}/auth/resend-otp`, () => {
    return HttpResponse.json({ success: true, message: 'OTP resent' });
  }),

  // Users
  http.get(`${BASE}/users/me`, () => {
    return HttpResponse.json({
      success: true,
      user: { _id: 'u1', name: 'Test Candidate', email: 'candidate@test.com', role: 'candidate' },
    });
  }),

  http.get(`${BASE}/users/online-recruiters`, () => {
    return HttpResponse.json({
      success: true,
      recruiters: [
        {
          _id: 'r1', name: 'Jane Recruiter', role: 'recruiter',
          company: { _id: 'c1', name: 'TechCorp', industry: 'Technology' },
        },
      ],
    });
  }),

  http.get(`${BASE}/users`, () => {
    return HttpResponse.json({
      success: true,
      profiles: [
        {
          _id: 'p1', headline: 'React Developer', skills: ['React', 'JavaScript'],
          currentLocation: 'Bengaluru', experienceYears: 2,
          userId: { _id: 'u1', name: 'Test Candidate', email: 'c@test.com' },
        },
      ],
    });
  }),

  // Jobs
  http.get(`${BASE}/jobs`, ({ request }) => {
    const url = new URL(request.url);
    const keyword = url.searchParams.get('keyword');
    const jobs = [
      { _id: 'j1', title: 'React Developer', location: 'Bengaluru', jobType: 'full-time',
        experienceMin: 1, experienceMax: 3, skills: ['React', 'JavaScript'],
        companyId: { _id: 'c1', name: 'TechCorp', isVerified: true },
        status: 'active', openings: 2, createdAt: new Date().toISOString() },
      { _id: 'j2', title: 'Node.js Engineer', location: 'Mumbai', jobType: 'remote',
        experienceMin: 2, experienceMax: 5, skills: ['Node.js', 'MongoDB'],
        companyId: { _id: 'c1', name: 'TechCorp', isVerified: false },
        status: 'active', openings: 1, createdAt: new Date().toISOString() },
    ];
    const filtered = keyword
      ? jobs.filter(j => j.title.toLowerCase().includes(keyword.toLowerCase()))
      : jobs;
    return HttpResponse.json({ success: true, jobs: filtered, total: filtered.length, page: 1, totalPages: 1 });
  }),

  http.get(`${BASE}/jobs/:id`, ({ params }) => {
    if (params.id === 'j1') {
      return HttpResponse.json({
        success: true,
        job: { _id: 'j1', title: 'React Developer', location: 'Bengaluru',
          jobType: 'full-time', experienceMin: 1, experienceMax: 3,
          skills: ['React'], companyId: { _id: 'c1', name: 'TechCorp' },
          status: 'active', openings: 2, createdAt: new Date().toISOString(),
          description: 'A great React job', postedBy: 'u2' },
        similar: [],
        hasApplied: false,
      });
    }
    return HttpResponse.json({ success: false, message: 'Job not found' }, { status: 404 });
  }),

  // Applications
  http.get(`${BASE}/applications/my-applications`, () => {
    return HttpResponse.json({
      success: true,
      applications: [
        {
          _id: 'a1', status: 'applied', createdAt: new Date().toISOString(),
          jobId: { _id: 'j1', title: 'React Developer', location: 'Bengaluru',
            companyId: { _id: 'c1', name: 'TechCorp' } },
          coverLetter: 'I am a great fit', timeline: [],
        },
      ],
    });
  }),

  http.post(`${BASE}/applications/jobs/:jobId/apply`, () => {
    return HttpResponse.json({ success: true, message: 'Application submitted' });
  }),

  http.get(`${BASE}/applications/jobs/:jobId/applications`, () => {
    return HttpResponse.json({
      success: true,
      applications: [
        {
          _id: 'a1', status: 'applied', createdAt: new Date().toISOString(),
          candidateId: { _id: 'u1', name: 'Test Candidate', email: 'c@test.com' },
          candidateProfile: { headline: 'React Developer', skills: ['React'], experienceYears: 2, currentLocation: 'Bengaluru' },
        },
      ],
    });
  }),

  // Candidate
  http.get(`${BASE}/candidate/profile`, () => {
    return HttpResponse.json({
      success: true,
      profile: {
        _id: 'p1', headline: 'Senior React Developer', summary: 'Experienced developer',
        skills: ['React', 'JavaScript', 'Node.js'], currentLocation: 'Bengaluru',
        experienceYears: 3, completenessScore: 75,
        experience: [{ title: 'Dev', company: 'ACME', startDate: '2020-01-01', isCurrent: true }],
        education: [{ institution: 'IIT', degree: 'B.Tech', fieldOfStudy: 'CS', startYear: 2016, endYear: 2020 }],
        projects: [], certifications: [], preferredLocations: [], languages: [],
      },
    });
  }),

  http.get(`${BASE}/candidate/profile-views`, () => {
    return HttpResponse.json({ success: true, profileViews: [] });
  }),

  http.put(`${BASE}/candidate/profile`, () => {
    return HttpResponse.json({ success: true });
  }),

  http.get(`${BASE}/candidate/job-alerts`, () => {
    return HttpResponse.json({
      success: true,
      jobAlerts: [
        { _id: 'al1', keyword: 'React', location: 'Bengaluru', frequency: 'daily', isActive: true, skills: ['React'] },
      ],
    });
  }),

  http.post(`${BASE}/candidate/job-alerts`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      success: true,
      jobAlerts: [{ _id: 'al2', ...body, isActive: true }],
    });
  }),

  http.delete(`${BASE}/candidate/job-alerts/:id`, () => {
    return HttpResponse.json({ success: true });
  }),

  // Notifications
  http.get(`${BASE}/notifications`, () => {
    return HttpResponse.json({
      success: true,
      notifications: [
        { _id: 'n1', title: 'Application update', body: 'You were shortlisted', isRead: false },
        { _id: 'n2', title: 'New message', body: 'Hi there', isRead: true },
      ],
      unreadCount: 1,
    });
  }),

  http.put(`${BASE}/notifications/read-all`, () => {
    return HttpResponse.json({ success: true });
  }),

  // Chat
  http.get(`${BASE}/chat/conversations`, () => {
    return HttpResponse.json({
      success: true,
      conversations: [
        { _id: 'conv1', participants: [
          { _id: 'u1', name: 'Candidate', role: 'candidate' },
          { _id: 'u2', name: 'Recruiter', role: 'recruiter' },
        ], lastMessage: { content: 'Hello!' } },
      ],
    });
  }),

  http.get(`${BASE}/chat/conversations/:id/messages`, () => {
    return HttpResponse.json({
      success: true,
      messages: [
        { _id: 'm1', content: 'Hello!', sender: { _id: 'u2', name: 'Recruiter' }, createdAt: new Date().toISOString(), conversationId: 'conv1' },
      ],
    });
  }),

  http.post(`${BASE}/chat/conversations`, async ({ request }) => {
    const { participantId } = await request.json();
    return HttpResponse.json({
      success: true,
      conversation: {
        _id: 'conv1',
        participants: [
          { _id: 'u1', name: 'Candidate', role: 'candidate' },
          { _id: participantId, name: 'Recruiter', role: 'recruiter' },
        ],
        lastMessage: null,
      },
    });
  }),

  http.post(`${BASE}/chat/conversations/:id/messages`, async ({ request }) => {
    const { content } = await request.json();
    return HttpResponse.json({
      success: true,
      message: { _id: 'm2', content, sender: { _id: 'u1', name: 'Candidate' }, createdAt: new Date().toISOString() },
    });
  }),

  // Saved Jobs
  http.get(`${BASE}/jobs/candidate/saved`, () => {
    return HttpResponse.json({
      success: true,
      jobs: [
        { _id: 'j1', title: 'React Developer', location: 'Bengaluru', jobType: 'full-time',
          companyId: { _id: 'c1', name: 'TechCorp' }, status: 'active' },
      ],
    });
  }),

  // Recommended Jobs
  http.get(`${BASE}/jobs/candidate/recommended`, () => {
    return HttpResponse.json({
      success: true,
      jobs: [
        { _id: 'j2', title: 'Node.js Engineer', location: 'Mumbai', jobType: 'remote',
          companyId: { _id: 'c1', name: 'TechCorp' }, status: 'active' },
      ],
    });
  }),

  // My Jobs (recruiter)
  http.get(`${BASE}/jobs/recruiter/my-jobs`, () => {
    return HttpResponse.json({
      success: true,
      jobs: [
        { _id: 'j3', title: 'Senior Frontend Dev', location: 'Delhi', jobType: 'full-time',
          experienceMin: 2, experienceMax: 5,
          companyId: { _id: 'c2', name: 'MyCorp' }, status: 'active', applicationsCount: 5, viewsCount: 100,
          createdAt: new Date().toISOString() },
      ],
    });
  }),

  // Companies
  http.get(`${BASE}/companies`, () => {
    return HttpResponse.json({
      success: true,
      companies: [
        { _id: 'c1', name: 'TechCorp', industry: 'Technology', location: 'Bengaluru', isVerified: true },
      ],
    });
  }),

  http.get(`${BASE}/companies/my`, () => {
    return HttpResponse.json({
      success: true,
      company: { _id: 'c2', name: 'MyCorp', industry: 'Technology', location: 'Delhi', description: 'A great company' },
    });
  }),

  http.get(`${BASE}/companies/:id/reviews`, () => {
    return HttpResponse.json({
      success: true,
      reviews: [
        { _id: 'rv1', rating: 4, title: 'Good place', pros: 'Great team', cons: 'Long hours', isAnonymous: false,
          candidateId: { _id: 'u1', name: 'Test User' }, createdAt: new Date().toISOString() },
      ],
    });
  }),

  http.get(`${BASE}/companies/:id`, ({ params }) => {
    if (params.id === 'c1') {
      return HttpResponse.json({
        success: true,
        company: {
          _id: 'c1', name: 'TechCorp', industry: 'Technology', location: 'Bengaluru',
          description: 'A tech company', website: 'https://techcorp.com', founded: 2010,
          size: '201-500', isVerified: true, rating: 4.2, reviewCount: 10,
        },
      });
    }
    return HttpResponse.json({ success: false, message: 'Company not found' }, { status: 404 });
  }),

  http.post(`${BASE}/companies`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ success: true, company: { _id: 'c3', ...body } });
  }),

  http.put(`${BASE}/companies/:id`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ success: true, company: { _id: 'c2', ...body } });
  }),

  http.post(`${BASE}/jobs`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      success: true,
      job: { _id: 'j4', ...body, companyId: { _id: 'c2', name: 'MyCorp' } },
    });
  }),

  // Admin
  http.get(`${BASE}/admin/stats`, () => {
    return HttpResponse.json({
      success: true,
      stats: { totalUsers: 150, totalJobs: 80, totalCompanies: 25, totalApplications: 300, candidates: 120, recruiters: 28, activeJobs: 60 },
      recentUsers: [
        { _id: 'u1', name: 'Test User', email: 't@test.com', role: 'candidate', createdAt: new Date().toISOString() },
      ],
      recentJobs: [
        { _id: 'j1', title: 'React Developer', location: 'Bengaluru', status: 'active',
          companyId: { name: 'TechCorp' }, createdAt: new Date().toISOString() },
      ],
    });
  }),

  http.get(`${BASE}/admin/users`, () => {
    return HttpResponse.json({
      success: true,
      users: [
        { _id: 'u1', name: 'Test Candidate', email: 'c@test.com', role: 'candidate', isEmailVerified: true, isBanned: false, createdAt: new Date().toISOString() },
        { _id: 'u2', name: 'Test Recruiter', email: 'r@test.com', role: 'recruiter', isEmailVerified: true, isBanned: false, createdAt: new Date().toISOString() },
      ],
      total: 2,
    });
  }),

  http.get(`${BASE}/admin/jobs`, () => {
    return HttpResponse.json({
      success: true,
      jobs: [
        { _id: 'j1', title: 'React Developer', location: 'Bengaluru', jobType: 'full-time',
          status: 'active', companyId: { name: 'TechCorp' }, createdAt: new Date().toISOString() },
      ],
      total: 1,
    });
  }),

  http.put(`${BASE}/admin/users/:id/ban`, () => {
    return HttpResponse.json({ success: true });
  }),

  http.delete(`${BASE}/admin/jobs/:id`, () => {
    return HttpResponse.json({ success: true });
  }),
];
