import { describe, it, expect } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import notificationReducer, {
  addNotification, markOneRead, removeNotification,
  fetchNotifications, markAllRead,
} from '../../redux/slices/notificationSlice';

const makeStore = (preloadedState) =>
  configureStore({ reducer: { notifications: notificationReducer }, preloadedState });

// ─── SYNC REDUCERS ───────────────────────────────────────────────────────────

describe('notificationSlice — addNotification reducer', () => {
  it('prepends the notification and increments unreadCount', () => {
    const existing = { _id: 'n1', title: 'Old', isRead: false };
    const store = makeStore({ notifications: { notifications: [existing], unreadCount: 1 } });
    store.dispatch(addNotification({ _id: 'n2', title: 'New', isRead: false }));
    const state = store.getState().notifications;
    expect(state.notifications[0]._id).toBe('n2'); // prepended
    expect(state.notifications).toHaveLength(2);
    expect(state.unreadCount).toBe(2);
  });
});

describe('notificationSlice — markOneRead reducer', () => {
  it('marks a notification as read and decrements unreadCount', () => {
    const store = makeStore({
      notifications: {
        notifications: [{ _id: 'n1', isRead: false }],
        unreadCount: 1,
      },
    });
    store.dispatch(markOneRead('n1'));
    const state = store.getState().notifications;
    expect(state.notifications[0].isRead).toBe(true);
    expect(state.unreadCount).toBe(0);
  });

  it('does not decrement below 0 for already-read notification', () => {
    const store = makeStore({
      notifications: {
        notifications: [{ _id: 'n1', isRead: true }],
        unreadCount: 0,
      },
    });
    store.dispatch(markOneRead('n1'));
    expect(store.getState().notifications.unreadCount).toBe(0);
  });

  it('does nothing for an unknown notification id', () => {
    const store = makeStore({
      notifications: {
        notifications: [{ _id: 'n1', isRead: false }],
        unreadCount: 1,
      },
    });
    store.dispatch(markOneRead('nX'));
    expect(store.getState().notifications.unreadCount).toBe(1);
  });
});

describe('notificationSlice — removeNotification reducer', () => {
  it('removes the notification with matching id', () => {
    const store = makeStore({
      notifications: {
        notifications: [{ _id: 'n1' }, { _id: 'n2' }],
        unreadCount: 1,
      },
    });
    store.dispatch(removeNotification('n1'));
    const state = store.getState().notifications;
    expect(state.notifications).toHaveLength(1);
    expect(state.notifications[0]._id).toBe('n2');
  });
});

// ─── THUNK: fetchNotifications ───────────────────────────────────────────────

describe('notificationSlice — fetchNotifications thunk', () => {
  it('sets notifications and unreadCount from API', async () => {
    const store = makeStore();
    await store.dispatch(fetchNotifications());
    const state = store.getState().notifications;
    expect(state.notifications).toHaveLength(2);
    expect(state.unreadCount).toBe(1);
    expect(state.loading).toBe(false);
  });

  it('sets loading true while pending', async () => {
    const store = makeStore();
    const promise = store.dispatch(fetchNotifications());
    expect(store.getState().notifications.loading).toBe(true);
    await promise;
    expect(store.getState().notifications.loading).toBe(false);
  });
});

// ─── THUNK: markAllRead ──────────────────────────────────────────────────────

describe('notificationSlice — markAllRead thunk', () => {
  it('marks all notifications as read and sets unreadCount to 0', async () => {
    const store = makeStore({
      notifications: {
        notifications: [
          { _id: 'n1', isRead: false },
          { _id: 'n2', isRead: false },
        ],
        unreadCount: 2,
        loading: false,
      },
    });
    await store.dispatch(markAllRead());
    const state = store.getState().notifications;
    expect(state.unreadCount).toBe(0);
    expect(state.notifications.every((n) => n.isRead)).toBe(true);
  });
});
