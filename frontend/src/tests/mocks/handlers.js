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

  // Users
  http.get(`${BASE}/users/me`, () => {
    return HttpResponse.json({
      success: true,
      user: { _id: 'u1', name: 'Test Candidate', email: 'candidate@test.com', role: 'candidate' },
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
          status: 'active', openings: 2, createdAt: new Date().toISOString() },
        similar: [],
      });
    }
    return HttpResponse.json({ success: false, message: 'Job not found' }, { status: 404 });
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
        ], lastMessage: null },
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
];
