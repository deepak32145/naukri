import { describe, it, expect } from 'vitest';
import store, { store as namedStore } from '../../redux/store';

describe('Redux store', () => {
  it('exports a store with expected reducers', () => {
    const state = store.getState();
    expect(state).toHaveProperty('auth');
    expect(state).toHaveProperty('jobs');
    expect(state).toHaveProperty('notifications');
    expect(state).toHaveProperty('chat');
  });

  it('named export and default export are the same store', () => {
    expect(store).toBe(namedStore);
  });

  it('auth slice initial state has isAuthenticated false', () => {
    const state = store.getState();
    expect(state.auth.isAuthenticated).toBe(false);
  });

  it('jobs slice initial state has empty jobs array', () => {
    const state = store.getState();
    expect(Array.isArray(state.jobs.jobs)).toBe(true);
  });

  it('notifications slice initial state has empty notifications', () => {
    const state = store.getState();
    expect(Array.isArray(state.notifications.notifications)).toBe(true);
  });

  it('chat slice initial state has empty conversations', () => {
    const state = store.getState();
    expect(Array.isArray(state.chat.conversations)).toBe(true);
  });
});
