import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../utils/renderWithProviders';
import LiveRecruiters from '../../pages/LiveRecruiters';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';

vi.mock('../../utils/socket', () => ({
  initSocket: vi.fn(),
  disconnectSocket: vi.fn(),
  getSocket: vi.fn(() => null),
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
  Toaster: () => null,
}));

const candidateAuth = {
  auth: { user: { _id: 'u1', name: 'Test Candidate', email: 'c@test.com', role: 'candidate' }, token: 'tok', isAuthenticated: true, initializing: false, loading: false, error: null },
  chat: { conversations: [], activeConversation: null, messages: {}, loading: false, onlineUserIds: [] },
};

describe('LiveRecruiters', () => {
  it('renders Live Recruiters heading', async () => {
    renderWithProviders(<LiveRecruiters />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText('Live Recruiters')).toBeInTheDocument();
    });
  });

  it('shows online banner with count', async () => {
    renderWithProviders(<LiveRecruiters />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText(/recruiter.*online right now/i)).toBeInTheDocument();
    });
  });

  it('shows recruiter name from MSW', async () => {
    renderWithProviders(<LiveRecruiters />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText('Jane Recruiter')).toBeInTheDocument();
    });
  });

  it('shows company name for recruiter', async () => {
    renderWithProviders(<LiveRecruiters />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText('TechCorp')).toBeInTheDocument();
    });
  });

  it('shows Ping Recruiter button', async () => {
    renderWithProviders(<LiveRecruiters />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Ping Recruiter/i })).toBeInTheDocument();
    });
  });

  it('shows Refresh button', async () => {
    renderWithProviders(<LiveRecruiters />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Refresh/i })).toBeInTheDocument();
    });
  });

  it('shows empty state when no recruiters online', async () => {
    server.use(
      http.get('http://localhost:5000/api/users/online-recruiters', () =>
        HttpResponse.json({ success: true, recruiters: [] })
      )
    );
    renderWithProviders(<LiveRecruiters />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText(/No recruiters online right now/i)).toBeInTheDocument();
    });
  });

  it('shows Online now indicator', async () => {
    renderWithProviders(<LiveRecruiters />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText(/Online now/i)).toBeInTheDocument();
    });
  });

  it('clicking Ping Recruiter calls POST /chat/conversations', async () => {
    let postCalled = false;
    server.use(
      http.post('http://localhost:5000/api/chat/conversations', async () => {
        postCalled = true;
        return HttpResponse.json({
          success: true,
          conversation: { _id: 'conv1', participants: [], lastMessage: null },
        });
      })
    );
    renderWithProviders(<LiveRecruiters />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Ping Recruiter/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Ping Recruiter/i }));
    await waitFor(() => {
      expect(postCalled).toBe(true);
    });
  });

  it('shows success toast when ping succeeds', async () => {
    const toast = await import('react-hot-toast');
    renderWithProviders(<LiveRecruiters />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Ping Recruiter/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Ping Recruiter/i }));
    await waitFor(() => {
      expect(toast.default.success).toHaveBeenCalled();
    });
  });

  it('shows error toast when ping fails', async () => {
    const toast = await import('react-hot-toast');
    server.use(
      http.post('http://localhost:5000/api/chat/conversations', () =>
        HttpResponse.json({ success: false, message: 'Error' }, { status: 500 })
      )
    );
    renderWithProviders(<LiveRecruiters />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Ping Recruiter/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Ping Recruiter/i }));
    await waitFor(() => {
      expect(toast.default.error).toHaveBeenCalledWith('Could not start conversation');
    });
  });

  it('shows error toast when initial load fails', async () => {
    const toast = await import('react-hot-toast');
    server.use(
      http.get('http://localhost:5000/api/users/online-recruiters', () =>
        HttpResponse.json({ success: false }, { status: 500 })
      )
    );
    renderWithProviders(<LiveRecruiters />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(toast.default.error).toHaveBeenCalledWith('Failed to load online recruiters');
    });
  });
});
