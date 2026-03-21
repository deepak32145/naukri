import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, render, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../redux/slices/authSlice';
import chatReducer from '../../redux/slices/chatSlice';
import notificationReducer from '../../redux/slices/notificationSlice';
import jobsReducer from '../../redux/slices/jobsSlice';
import SocketProvider from '../../components/common/SocketProvider';
import { getSocket } from '../../utils/socket';

const mockSocket = vi.hoisted(() => ({
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
}));

vi.mock('../../utils/socket', () => ({
  getSocket: vi.fn(() => mockSocket),
  initSocket: vi.fn(),
  disconnectSocket: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
  default: vi.fn((msg, opts) => {}),
  Toaster: () => null,
}));
vi.mock('react-hot-toast', () => ({
  default: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
  Toaster: () => null,
}));

const guestState = {
  auth: { isAuthenticated: false, user: null, token: null, initializing: false, loading: false },
  chat: { activeConversation: null, conversations: [], messages: {}, loading: false, typingUsers: {}, onlineUserIds: [] },
  notifications: { notifications: [], unreadCount: 0, loading: false },
};

const authState = {
  auth: { isAuthenticated: true, user: { _id: 'u1' }, token: 'tok', initializing: false, loading: false },
  chat: { activeConversation: null, conversations: [], messages: {}, loading: false, typingUsers: {}, onlineUserIds: [] },
  notifications: { notifications: [], unreadCount: 0, loading: false },
};

const createStore = (preloadedState) =>
  configureStore({
    reducer: {
      auth: authReducer,
      chat: chatReducer,
      notifications: notificationReducer,
      jobs: jobsReducer,
    },
    preloadedState,
  });

const renderWithStore = (ui, state) => {
  const store = createStore(state);
  return { ...render(<Provider store={store}>{ui}</Provider>), store };
};

const EXPECTED_EVENTS = [
  'notification',
  'receive_message',
  'typing_indicator',
  'stop_typing_indicator',
  'application_status_update',
  'online_users',
];

// Helper to get the handler registered for a given event
const getHandler = (event) => {
  const call = mockSocket.on.mock.calls.find(([e]) => e === event);
  return call ? call[1] : null;
};

describe('SocketProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children', () => {
    getSocket.mockReturnValue(null);
    renderWithStore(
      <SocketProvider><div>child content</div></SocketProvider>,
      guestState
    );
    expect(screen.getByText('child content')).toBeInTheDocument();
  });

  it('does not attach socket listeners when not authenticated', () => {
    getSocket.mockReturnValue(null);
    renderWithStore(
      <SocketProvider><div>child</div></SocketProvider>,
      guestState
    );
    expect(mockSocket.on).not.toHaveBeenCalled();
  });

  it('attaches socket listeners when authenticated and socket exists', () => {
    getSocket.mockReturnValue(mockSocket);
    renderWithStore(
      <SocketProvider><div>child</div></SocketProvider>,
      authState
    );
    EXPECTED_EVENTS.forEach((event) => {
      expect(mockSocket.on).toHaveBeenCalledWith(event, expect.any(Function));
    });
    expect(mockSocket.on).toHaveBeenCalledTimes(EXPECTED_EVENTS.length);
  });

  it('cleans up listeners on unmount', () => {
    getSocket.mockReturnValue(mockSocket);
    const { unmount } = renderWithStore(
      <SocketProvider><div>child</div></SocketProvider>,
      authState
    );
    act(() => {
      unmount();
    });
    EXPECTED_EVENTS.forEach((event) => {
      expect(mockSocket.off).toHaveBeenCalledWith(event, expect.any(Function));
    });
    expect(mockSocket.off).toHaveBeenCalledTimes(EXPECTED_EVENTS.length);
  });

  it('does not attach listeners when authenticated but socket is null', () => {
    getSocket.mockReturnValue(null);
    renderWithStore(
      <SocketProvider><span>test</span></SocketProvider>,
      authState
    );
    expect(mockSocket.on).not.toHaveBeenCalled();
  });

  it('renders multiple children', () => {
    getSocket.mockReturnValue(null);
    renderWithStore(
      <SocketProvider>
        <div>first</div>
        <div>second</div>
      </SocketProvider>,
      guestState
    );
    expect(screen.getByText('first')).toBeInTheDocument();
    expect(screen.getByText('second')).toBeInTheDocument();
  });

  it('onNotification handler dispatches addNotification and shows toast', () => {
    getSocket.mockReturnValue(mockSocket);
    const { store } = renderWithStore(
      <SocketProvider><div>child</div></SocketProvider>,
      authState
    );
    const handler = getHandler('notification');
    expect(handler).toBeTruthy();
    act(() => {
      handler({ _id: 'n1', title: 'Test Alert', body: 'body', isRead: false });
    });
    const state = store.getState();
    expect(state.notifications.notifications.length).toBeGreaterThan(0);
  });

  it('onReceiveMessage handler dispatches addMessage', () => {
    getSocket.mockReturnValue(mockSocket);
    const { store } = renderWithStore(
      <SocketProvider><div>child</div></SocketProvider>,
      authState
    );
    const handler = getHandler('receive_message');
    expect(handler).toBeTruthy();
    act(() => {
      handler({ _id: 'm1', content: 'Hello', conversationId: 'conv1', sender: { _id: 'u2' }, createdAt: new Date().toISOString() });
    });
    const state = store.getState();
    expect(state.chat.messages['conv1']).toBeDefined();
  });

  it('onTyping handler dispatches setTyping', () => {
    getSocket.mockReturnValue(mockSocket);
    const { store } = renderWithStore(
      <SocketProvider><div>child</div></SocketProvider>,
      authState
    );
    const handler = getHandler('typing_indicator');
    expect(handler).toBeTruthy();
    act(() => {
      handler({ userId: 'u2', name: 'Bob', conversationId: 'conv1' });
    });
    const state = store.getState();
    expect(state.chat.typingUsers).toBeDefined();
  });

  it('onStopTyping handler dispatches clearTyping', () => {
    getSocket.mockReturnValue(mockSocket);
    const { store } = renderWithStore(
      <SocketProvider><div>child</div></SocketProvider>,
      authState
    );
    const handler = getHandler('stop_typing_indicator');
    expect(handler).toBeTruthy();
    act(() => {
      handler({ userId: 'u2', conversationId: 'conv1' });
    });
    // Just verifying no crash
  });

  it('onAppStatus handler shows toast', () => {
    getSocket.mockReturnValue(mockSocket);
    renderWithStore(
      <SocketProvider><div>child</div></SocketProvider>,
      authState
    );
    const handler = getHandler('application_status_update');
    expect(handler).toBeTruthy();
    act(() => {
      handler({ jobTitle: 'React Developer', status: 'shortlisted' });
    });
    // toast.success should have been called
  });

  it('onOnlineUsers handler dispatches setOnlineUsers', () => {
    getSocket.mockReturnValue(mockSocket);
    const { store } = renderWithStore(
      <SocketProvider><div>child</div></SocketProvider>,
      authState
    );
    const handler = getHandler('online_users');
    expect(handler).toBeTruthy();
    act(() => {
      handler(['u1', 'u2']);
    });
    const state = store.getState();
    expect(state.chat.onlineUserIds).toEqual(['u1', 'u2']);
  });
});
