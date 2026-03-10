const request = require('supertest');
const app = require('../src/app');
const Message = require('../src/models/Message.model');
const Conversation = require('../src/models/Conversation.model');
const { connect, clearDB, disconnect } = require('./setup');
const { createUser, createConversation } = require('./helpers');

jest.mock('../src/utils/email', () => ({ sendEmail: jest.fn(), emailTemplates: {} }));
jest.mock('../src/utils/socket', () => ({ initSocket: jest.fn(), onlineUsers: new Map() }));
jest.mock('../src/utils/notification', () => ({ createNotification: jest.fn() }));
jest.mock('../src/config/cloudinary', () => ({
  cloudinary: { uploader: { destroy: jest.fn() } },
  uploadAvatar: { single: () => (req, res, next) => next() },
  uploadResume: { single: () => (req, res, next) => next() },
  uploadLogo: { single: () => (req, res, next) => next() },
}));

beforeAll(async () => { await connect(); });
afterEach(async () => { await clearDB(); });
afterAll(async () => { await disconnect(); });

describe('GET /api/chat/conversations', () => {
  it('returns conversations for the authenticated user', async () => {
    const { user: u1, token: t1 } = await createUser('candidate', { email: 'c1@test.com' });
    const { user: u2 } = await createUser('recruiter', { email: 'r1@test.com' });
    await createConversation(u1._id, u2._id);

    const res = await request(app)
      .get('/api/chat/conversations')
      .set('Authorization', `Bearer ${t1}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.conversations.length).toBe(1);
  });

  it('returns empty array when user has no conversations', async () => {
    const { token } = await createUser('candidate');
    const res = await request(app)
      .get('/api/chat/conversations')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.conversations.length).toBe(0);
  });

  it('does not return conversations the user is not part of', async () => {
    const { user: u1, token: t1 } = await createUser('candidate', { email: 'cx1@test.com' });
    const { user: u2 } = await createUser('recruiter', { email: 'rx1@test.com' });
    const { user: u3 } = await createUser('candidate', { email: 'cx2@test.com' });
    // conversation between u2 and u3 — u1 should NOT see it
    await createConversation(u2._id, u3._id);

    const res = await request(app)
      .get('/api/chat/conversations')
      .set('Authorization', `Bearer ${t1}`);
    expect(res.body.conversations.length).toBe(0);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/chat/conversations');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/chat/conversations', () => {
  it('creates a new conversation between two users', async () => {
    const { user: u1, token: t1 } = await createUser('candidate', { email: 'new1@test.com' });
    const { user: u2 } = await createUser('recruiter', { email: 'new2@test.com' });

    const res = await request(app)
      .post('/api/chat/conversations')
      .set('Authorization', `Bearer ${t1}`)
      .send({ participantId: u2._id.toString() });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.conversation.participants.length).toBe(2);
  });

  it('returns the existing conversation if one already exists', async () => {
    const { user: u1, token: t1 } = await createUser('candidate', { email: 'ex1@test.com' });
    const { user: u2 } = await createUser('recruiter', { email: 'ex2@test.com' });
    await createConversation(u1._id, u2._id);

    // Start again — should return same conversation, not create a new one
    const res = await request(app)
      .post('/api/chat/conversations')
      .set('Authorization', `Bearer ${t1}`)
      .send({ participantId: u2._id.toString() });
    expect(res.status).toBe(200);

    const total = await Conversation.countDocuments();
    expect(total).toBe(1);
  });

  it('returns 400 when participantId is missing', async () => {
    const { token } = await createUser('candidate');
    const res = await request(app)
      .post('/api/chat/conversations')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/chat/conversations/:id/messages', () => {
  it('returns messages for a conversation the user is part of', async () => {
    const { user: u1, token: t1 } = await createUser('candidate', { email: 'msg1@test.com' });
    const { user: u2 } = await createUser('recruiter', { email: 'msg2@test.com' });
    const conv = await createConversation(u1._id, u2._id);

    // Create some messages
    await Message.create({ conversationId: conv._id, sender: u2._id, content: 'Hello!' });
    await Message.create({ conversationId: conv._id, sender: u1._id, content: 'Hi there!' });

    const res = await request(app)
      .get(`/api/chat/conversations/${conv._id}/messages`)
      .set('Authorization', `Bearer ${t1}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.messages.length).toBe(2);
  });

  it('returns 404 when conversation does not exist', async () => {
    const { token } = await createUser('candidate');
    const fakeId = '507f1f77bcf86cd799439011';
    const res = await request(app)
      .get(`/api/chat/conversations/${fakeId}/messages`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('returns 404 when user is not a participant', async () => {
    const { user: u1 } = await createUser('candidate', { email: 'np1@test.com' });
    const { user: u2 } = await createUser('recruiter', { email: 'np2@test.com' });
    const { token: t3 } = await createUser('candidate', { email: 'np3@test.com' });
    const conv = await createConversation(u1._id, u2._id);

    const res = await request(app)
      .get(`/api/chat/conversations/${conv._id}/messages`)
      .set('Authorization', `Bearer ${t3}`);
    expect(res.status).toBe(404);
  });

  it('marks unread messages from others as read', async () => {
    const { user: u1, token: t1 } = await createUser('candidate', { email: 'rd1@test.com' });
    const { user: u2 } = await createUser('recruiter', { email: 'rd2@test.com' });
    const conv = await createConversation(u1._id, u2._id);

    await Message.create({ conversationId: conv._id, sender: u2._id, content: 'Unread!', isRead: false });

    await request(app)
      .get(`/api/chat/conversations/${conv._id}/messages`)
      .set('Authorization', `Bearer ${t1}`);

    const unread = await Message.countDocuments({ conversationId: conv._id, isRead: false });
    expect(unread).toBe(0);
  });
});

describe('POST /api/chat/conversations/:id/messages', () => {
  it('sends a message in a conversation', async () => {
    const { user: u1, token: t1 } = await createUser('candidate', { email: 'send1@test.com' });
    const { user: u2 } = await createUser('recruiter', { email: 'send2@test.com' });
    const conv = await createConversation(u1._id, u2._id);

    const res = await request(app)
      .post(`/api/chat/conversations/${conv._id}/messages`)
      .set('Authorization', `Bearer ${t1}`)
      .send({ content: 'Hello from candidate!' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message.content).toBe('Hello from candidate!');

    const count = await Message.countDocuments({ conversationId: conv._id });
    expect(count).toBe(1);
  });

  it('returns 404 when conversation not found or user not a participant', async () => {
    const { token } = await createUser('candidate');
    const fakeId = '507f1f77bcf86cd799439011';
    const res = await request(app)
      .post(`/api/chat/conversations/${fakeId}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Test' });
    expect(res.status).toBe(404);
  });
});
