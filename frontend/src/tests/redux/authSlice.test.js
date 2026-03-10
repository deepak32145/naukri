import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import authReducer, {
  clearError, updateUser, loginUser, registerUser, fetchMe, logoutUser,
} from '../../redux/slices/authSlice';

// Mock socket utility — we don't want real socket connections in tests
vi.mock('../../utils/socket', () => ({
  initSocket: vi.fn(),
  disconnectSocket: vi.fn(),
}));

const makeStore = (preloadedState) =>
  configureStore({ reducer: { auth: authReducer }, preloadedState });

// ─── INITIAL STATE ───────────────────────────────────────────────────────────

describe('authSlice — initial state', () => {
  it('has correct default shape when no token in localStorage', () => {
    localStorage.clear();
    const store = makeStore();
    const state = store.getState().auth;
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });
});

// ─── SYNC REDUCERS ───────────────────────────────────────────────────────────

describe('authSlice — clearError reducer', () => {
  it('clears the error field', () => {
    const store = makeStore({ auth: { error: 'Something went wrong' } });
    store.dispatch(clearError());
    expect(store.getState().auth.error).toBeNull();
  });
});

describe('authSlice — updateUser reducer', () => {
  it('merges new data into the existing user object', () => {
    const store = makeStore({
      auth: { user: { _id: 'u1', name: 'Old Name', role: 'candidate' } },
    });
    store.dispatch(updateUser({ name: 'New Name', avatar: { url: 'http://img.url' } }));
    const { user } = store.getState().auth;
    expect(user.name).toBe('New Name');
    expect(user.avatar.url).toBe('http://img.url');
    expect(user._id).toBe('u1'); // unchanged fields preserved
  });
});

// ─── THUNK: loginUser ────────────────────────────────────────────────────────

describe('authSlice — loginUser thunk', () => {
  beforeEach(() => localStorage.clear());

  it('sets user, token, isAuthenticated on success', async () => {
    const store = makeStore();
    await store.dispatch(loginUser({ email: 'candidate@test.com', password: 'password123' }));
    const state = store.getState().auth;
    expect(state.isAuthenticated).toBe(true);
    expect(state.user.role).toBe('candidate');
    expect(state.token).toBe('mock-candidate-token');
    expect(localStorage.getItem('token')).toBe('mock-candidate-token');
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('sets error on failed login', async () => {
    const store = makeStore();
    await store.dispatch(loginUser({ email: 'wrong@test.com', password: 'wrong' }));
    const state = store.getState().auth;
    expect(state.isAuthenticated).toBe(false);
    expect(state.error).toBe('Invalid credentials');
    expect(state.loading).toBe(false);
  });

  it('sets loading to true while pending', async () => {
    const store = makeStore();
    const promise = store.dispatch(loginUser({ email: 'candidate@test.com', password: 'password123' }));
    // Check pending state immediately
    expect(store.getState().auth.loading).toBe(true);
    await promise;
    expect(store.getState().auth.loading).toBe(false);
  });
});

// ─── THUNK: registerUser ─────────────────────────────────────────────────────

describe('authSlice — registerUser thunk', () => {
  beforeEach(() => localStorage.clear());

  it('sets user, token, isAuthenticated on successful registration', async () => {
    const store = makeStore();
    await store.dispatch(registerUser({ name: 'New User', email: 'new@test.com', password: 'pass123', role: 'candidate' }));
    const state = store.getState().auth;
    expect(state.isAuthenticated).toBe(true);
    expect(state.user.email).toBe('new@test.com');
    expect(state.token).toBe('mock-token');
  });
});

// ─── THUNK: fetchMe ──────────────────────────────────────────────────────────

describe('authSlice — fetchMe thunk', () => {
  it('sets user, isAuthenticated=true, initializing=false on success', async () => {
    const store = makeStore({ auth: { initializing: true, isAuthenticated: false, user: null } });
    await store.dispatch(fetchMe());
    const state = store.getState().auth;
    expect(state.user.email).toBe('candidate@test.com');
    expect(state.isAuthenticated).toBe(true);
    expect(state.initializing).toBe(false);
  });

  it('clears token and sets initializing=false on failure', async () => {
    // Override MSW to return 401
    const { server } = await import('../mocks/server');
    const { http, HttpResponse } = await import('msw');
    server.use(
      http.get('http://localhost:5000/api/users/me', () =>
        HttpResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
      )
    );
    localStorage.setItem('token', 'stale-token');
    const store = makeStore({ auth: { initializing: true, token: 'stale-token' } });
    await store.dispatch(fetchMe());
    const state = store.getState().auth;
    expect(state.isAuthenticated).toBe(false);
    expect(state.token).toBeNull();
    expect(state.initializing).toBe(false);
    expect(localStorage.getItem('token')).toBeNull();
  });
});

// ─── THUNK: logoutUser ───────────────────────────────────────────────────────

describe('authSlice — logoutUser thunk', () => {
  it('clears user, token, isAuthenticated on logout', async () => {
    localStorage.setItem('token', 'mock-candidate-token');
    const store = makeStore({
      auth: {
        user: { _id: 'u1', name: 'Test', role: 'candidate' },
        token: 'mock-candidate-token',
        isAuthenticated: true,
      },
    });
    await store.dispatch(logoutUser());
    const state = store.getState().auth;
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(localStorage.getItem('token')).toBeNull();
  });
});
