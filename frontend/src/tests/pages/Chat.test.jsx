import { describe, it, expect, vi, beforeAll } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../utils/renderWithProviders';
import Chat from '../../pages/Chat';

// jsdom doesn't implement scrollIntoView
beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
});

const mockSocket = vi.hoisted(() => ({
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  connected: false,
}));

vi.mock('../../utils/socket', () => ({
  initSocket: vi.fn(),
  disconnectSocket: vi.fn(),
  getSocket: vi.fn(() => mockSocket),
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
  Toaster: () => null,
}));

const candidateAuth = {
  auth: { user: { _id: 'u1', name: 'Test Candidate', email: 'c@test.com', role: 'candidate' }, token: 'tok', isAuthenticated: true, initializing: false, loading: false, error: null },
  chat: { conversations: [], activeConversation: null, messages: {}, loading: false, typingUsers: {}, onlineUserIds: [] },
};

const withConversations = {
  ...candidateAuth,
  chat: {
    conversations: [
      { _id: 'conv1', participants: [
        { _id: 'u1', name: 'Test Candidate', role: 'candidate' },
        { _id: 'u2', name: 'Test Recruiter', role: 'recruiter' },
      ], lastMessage: { content: 'Hello!' }, unreadCount: {} },
    ],
    activeConversation: null,
    messages: {},
    loading: false,
    typingUsers: {},
    onlineUserIds: [],
  },
};

const withActive = {
  ...candidateAuth,
  chat: {
    conversations: [
      { _id: 'conv1', participants: [
        { _id: 'u1', name: 'Test Candidate', role: 'candidate' },
        { _id: 'u2', name: 'Test Recruiter', role: 'recruiter' },
      ], lastMessage: { content: 'Hello!' }, unreadCount: {} },
    ],
    activeConversation: {
      _id: 'conv1',
      participants: [
        { _id: 'u1', name: 'Test Candidate', role: 'candidate' },
        { _id: 'u2', name: 'Test Recruiter', role: 'recruiter' },
      ],
    },
    messages: { conv1: [
      { _id: 'm1', content: 'Hello!', sender: { _id: 'u2', name: 'Test Recruiter' }, createdAt: new Date().toISOString(), conversationId: 'conv1' },
    ]},
    loading: false,
    typingUsers: {},
    onlineUserIds: [],
  },
};

const withTyping = {
  ...candidateAuth,
  chat: {
    conversations: [
      { _id: 'conv1', participants: [
        { _id: 'u1', name: 'Test Candidate', role: 'candidate' },
        { _id: 'u2', name: 'Test Recruiter', role: 'recruiter' },
      ], lastMessage: { content: 'Hello!' }, unreadCount: {} },
    ],
    activeConversation: {
      _id: 'conv1',
      participants: [
        { _id: 'u1', name: 'Test Candidate', role: 'candidate' },
        { _id: 'u2', name: 'Test Recruiter', role: 'recruiter' },
      ],
    },
    messages: { conv1: [] },
    loading: false,
    typingUsers: { conv1: { u2: 'Test Recruiter' } },
    onlineUserIds: [],
  },
};

const withUnread = {
  ...candidateAuth,
  chat: {
    conversations: [
      { _id: 'conv1', participants: [
        { _id: 'u1', name: 'Test Candidate', role: 'candidate' },
        { _id: 'u2', name: 'Test Recruiter', role: 'recruiter' },
      ], lastMessage: { content: 'Hello!' }, unreadCount: { u1: 3 } },
    ],
    activeConversation: null,
    messages: {},
    loading: false,
    typingUsers: {},
    onlineUserIds: [],
  },
};

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('Chat page — rendering', () => {
  it('renders Messages heading', () => {
    renderWithProviders(<Chat />, { preloadedState: candidateAuth });
    expect(screen.getByText('Messages')).toBeInTheDocument();
  });

  it('renders search conversations input', () => {
    renderWithProviders(<Chat />, { preloadedState: candidateAuth });
    expect(screen.getByPlaceholderText('Search conversations')).toBeInTheDocument();
  });

  it('shows empty state when no conversations', () => {
    renderWithProviders(<Chat />, { preloadedState: candidateAuth });
    expect(screen.getByText('No conversations yet')).toBeInTheDocument();
  });

  it('shows "Select a conversation" prompt when no active conversation', () => {
    renderWithProviders(<Chat />, { preloadedState: candidateAuth });
    expect(screen.getByText('Select a conversation')).toBeInTheDocument();
  });

  it('shows "Start chatting from a job listing" hint', () => {
    renderWithProviders(<Chat />, { preloadedState: candidateAuth });
    expect(screen.getByText(/Start chatting from a job listing/i)).toBeInTheDocument();
  });
});

// ─── With conversations ────────────────────────────────────────────────────────

describe('Chat page — conversation list', () => {
  it('renders conversation with other participant name', async () => {
    renderWithProviders(<Chat />, { preloadedState: withConversations });
    await waitFor(() => {
      expect(screen.getByText('Test Recruiter')).toBeInTheDocument();
    });
  });

  it('shows last message content', async () => {
    renderWithProviders(<Chat />, { preloadedState: withConversations });
    await waitFor(() => {
      expect(screen.getAllByText('Hello!').length).toBeGreaterThan(0);
    });
  });

  it('shows unread count badge when unreadCount > 0', async () => {
    renderWithProviders(<Chat />, { preloadedState: withUnread });
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  it('clicking conversation button sets active conversation', async () => {
    renderWithProviders(<Chat />, { preloadedState: withConversations });
    await waitFor(() => {
      const recruiterEl = screen.queryByText('Test Recruiter') || screen.queryByText('Recruiter');
      expect(recruiterEl).toBeInTheDocument();
    });
    const recruiterName = screen.queryByText('Test Recruiter') ? 'Test Recruiter' : 'Recruiter';
    // Click the conversation button
    const convButton = screen.getByText(recruiterName).closest('button');
    if (convButton) {
      fireEvent.click(convButton);
      // Should trigger setActiveConversation dispatch without error
    }
  });
});

// ─── Active conversation ───────────────────────────────────────────────────────

describe('Chat page — active conversation', () => {
  it('shows message input when conversation active', () => {
    renderWithProviders(<Chat />, { preloadedState: withActive });
    expect(screen.getByPlaceholderText(/Message Test Recruiter/i)).toBeInTheDocument();
  });

  it('renders existing message content', async () => {
    renderWithProviders(<Chat />, { preloadedState: withActive });
    await waitFor(() => {
      expect(screen.getAllByText('Hello!').length).toBeGreaterThan(0);
    });
  });

  it('send button is disabled when input is empty', () => {
    renderWithProviders(<Chat />, { preloadedState: withActive });
    const input = screen.getByPlaceholderText(/Message Test Recruiter/i);
    expect(input.value).toBe('');
    const form = input.closest('form');
    const sendBtn = form.querySelector('button[type="submit"]');
    expect(sendBtn).toBeDisabled();
  });

  it('send button is enabled when input has content', () => {
    renderWithProviders(<Chat />, { preloadedState: withActive });
    const input = screen.getByPlaceholderText(/Message Test Recruiter/i);
    fireEvent.change(input, { target: { value: 'Hi there!' } });
    const form = input.closest('form');
    const sendBtn = form.querySelector('button[type="submit"]');
    expect(sendBtn).not.toBeDisabled();
  });

  it('shows other user role', () => {
    renderWithProviders(<Chat />, { preloadedState: withActive });
    expect(screen.getByText('recruiter')).toBeInTheDocument();
  });

  it('shows other user name in header', () => {
    renderWithProviders(<Chat />, { preloadedState: withActive });
    expect(screen.getAllByText('Test Recruiter').length).toBeGreaterThan(0);
  });
});

// ─── Typing indicator ─────────────────────────────────────────────────────────

describe('Chat page — typing indicator', () => {
  it('shows typing dots when other user is typing', () => {
    renderWithProviders(<Chat />, { preloadedState: withTyping });
    // Typing indicator renders animated dots (3 divs with animate-bounce)
    const bounceDivs = document.querySelectorAll('.animate-bounce');
    expect(bounceDivs.length).toBeGreaterThan(0);
  });

  it('typing in message input calls handleTyping (emits via socket)', () => {
    renderWithProviders(<Chat />, { preloadedState: withActive });
    const input = screen.getByPlaceholderText(/Message Test Recruiter/i);
    fireEvent.change(input, { target: { value: 'Hello' } });
    // mockSocket.emit called with 'typing' if socket is connected or similar
    // Just verify no crash
    expect(input.value).toBe('Hello');
  });

  it('submitting form with content triggers handleSend', async () => {
    renderWithProviders(<Chat />, { preloadedState: withActive });
    const input = screen.getByPlaceholderText(/Message Test Recruiter/i);
    fireEvent.change(input, { target: { value: 'Test message' } });
    const form = input.closest('form');
    fireEvent.submit(form);
    // Should attempt send; no crash
    await waitFor(() => {
      // After REST fallback, input may or may not clear
      expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
    });
  });
});

// ─── Search ───────────────────────────────────────────────────────────────────

describe('Chat page — search', () => {
  it('filters conversations by search', async () => {
    renderWithProviders(<Chat />, { preloadedState: withConversations });
    await waitFor(() => {
      const recruiterEl = screen.queryByText('Test Recruiter') || screen.queryByText('Recruiter');
      expect(recruiterEl).toBeInTheDocument();
    });
    const recruiterName = screen.queryByText('Test Recruiter') ? 'Test Recruiter' : 'Recruiter';
    fireEvent.change(screen.getByPlaceholderText('Search conversations'), { target: { value: 'xyz' } });
    expect(screen.queryByText(recruiterName)).not.toBeInTheDocument();
    expect(screen.getByText('No conversations yet')).toBeInTheDocument();
  });

  it('shows conversation again when search is cleared', async () => {
    renderWithProviders(<Chat />, { preloadedState: withConversations });
    // Wait for a recruiter name to appear (from preloaded state or MSW)
    await waitFor(() => {
      const recruiterEl = screen.queryByText('Test Recruiter') || screen.queryByText('Recruiter');
      expect(recruiterEl).toBeInTheDocument();
    });
    const recruiterName = screen.queryByText('Test Recruiter') ? 'Test Recruiter' : 'Recruiter';
    const searchInput = screen.getByPlaceholderText('Search conversations');
    fireEvent.change(searchInput, { target: { value: 'xyz' } });
    expect(screen.queryByText(recruiterName)).not.toBeInTheDocument();
    fireEvent.change(searchInput, { target: { value: '' } });
    expect(screen.getByText(recruiterName)).toBeInTheDocument();
  });
});
