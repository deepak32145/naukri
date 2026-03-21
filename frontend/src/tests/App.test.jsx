import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import App from '../App';
import authReducer from '../redux/slices/authSlice';
import jobsReducer from '../redux/slices/jobsSlice';
import notificationReducer from '../redux/slices/notificationSlice';
import chatReducer from '../redux/slices/chatSlice';

vi.mock('../utils/socket', () => ({
  initSocket: vi.fn(),
  disconnectSocket: vi.fn(),
  getSocket: vi.fn(() => null),
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
  Toaster: () => null,
}));

const guestState = {
  auth: { user: null, token: null, isAuthenticated: false, initializing: false, loading: false, error: null },
  jobs: { jobs: [], loading: false, error: null, total: 0, page: 1, totalPages: 1, savedJobs: [], currentJob: null },
  notifications: { notifications: [], unreadCount: 0, loading: false },
  chat: { activeConversation: null, conversations: [], messages: {}, loading: false, typingUsers: {}, onlineUserIds: [] },
};

const createStore = (preloadedState) =>
  configureStore({
    reducer: {
      auth: authReducer,
      jobs: jobsReducer,
      notifications: notificationReducer,
      chat: chatReducer,
    },
    preloadedState,
  });

const renderApp = (state = guestState) => {
  const store = createStore(state);
  return render(
    <Provider store={store}>
      <App />
    </Provider>
  );
};

describe('App', () => {
  it('renders without crashing with guest state', () => {
    expect(() => renderApp()).not.toThrow();
  });

  it('shows Naukri logo in Navbar', async () => {
    renderApp();
    await waitFor(() => {
      expect(screen.getByText('Naukri')).toBeInTheDocument();
    });
  });

  it('shows Login link when not authenticated', async () => {
    renderApp();
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /Login/i })).toBeInTheDocument();
    });
  });

  it('shows Register link when not authenticated', async () => {
    renderApp();
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /Register/i })).toBeInTheDocument();
    });
  });
});
