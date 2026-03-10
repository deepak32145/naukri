const request = require('supertest');
const app = require('../src/app');
const Notification = require('../src/models/Notification.model');
const { connect, clearDB, disconnect } = require('./setup');
const { createUser, createNotification } = require('./helpers');

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

describe('GET /api/notifications', () => {
  it('returns user notifications with unread count', async () => {
    const { user, token } = await createUser('candidate');
    await createNotification(user._id, { isRead: false });
    await createNotification(user._id, { isRead: false });
    await createNotification(user._id, { isRead: true });

    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.notifications.length).toBe(3);
    expect(res.body.unreadCount).toBe(2);
  });

  it('returns empty for user with no notifications', async () => {
    const { token } = await createUser('candidate');
    const res = await request(app).get('/api/notifications').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.notifications.length).toBe(0);
    expect(res.body.unreadCount).toBe(0);
  });

  it('only returns notifications for the requesting user', async () => {
    const { user: u1, token: t1 } = await createUser('candidate', { email: 'n1@test.com' });
    const { user: u2 } = await createUser('candidate', { email: 'n2@test.com' });
    await createNotification(u1._id);
    await createNotification(u2._id);

    const res = await request(app).get('/api/notifications').set('Authorization', `Bearer ${t1}`);
    expect(res.body.notifications.length).toBe(1);
  });
});

describe('PUT /api/notifications/:id/read', () => {
  it('marks a notification as read', async () => {
    const { user, token } = await createUser('candidate');
    const notif = await createNotification(user._id, { isRead: false });

    const res = await request(app)
      .put(`/api/notifications/${notif._id}/read`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const updated = await Notification.findById(notif._id);
    expect(updated.isRead).toBe(true);
  });
});

describe('PUT /api/notifications/read-all', () => {
  it('marks all notifications as read', async () => {
    const { user, token } = await createUser('candidate');
    await createNotification(user._id, { isRead: false });
    await createNotification(user._id, { isRead: false });

    const res = await request(app)
      .put('/api/notifications/read-all')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);

    const unread = await Notification.countDocuments({ userId: user._id, isRead: false });
    expect(unread).toBe(0);
  });
});

describe('DELETE /api/notifications/:id', () => {
  it('deletes a notification owned by the user', async () => {
    const { user, token } = await createUser('candidate');
    const notif = await createNotification(user._id);

    const res = await request(app)
      .delete(`/api/notifications/${notif._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);

    const deleted = await Notification.findById(notif._id);
    expect(deleted).toBeNull();
  });

  it('does not delete another user\'s notification', async () => {
    const { user: u1 } = await createUser('candidate', { email: 'del1@test.com' });
    const { token: t2 } = await createUser('candidate', { email: 'del2@test.com' });
    const notif = await createNotification(u1._id);

    await request(app)
      .delete(`/api/notifications/${notif._id}`)
      .set('Authorization', `Bearer ${t2}`);

    const stillExists = await Notification.findById(notif._id);
    expect(stillExists).not.toBeNull();
  });
});
