import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../utils/renderWithProviders';
import RecruiterDashboard from '../../../pages/recruiter/RecruiterDashboard';

vi.mock('../../../utils/socket', () => ({
  initSocket: vi.fn(),
  disconnectSocket: vi.fn(),
  getSocket: vi.fn(() => null),
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
  Toaster: () => null,
}));

const recruiterAuth = {
  auth: {
    user: { _id: 'u2', name: 'Test Recruiter', email: 'r@test.com', role: 'recruiter' },
    token: 'tok', isAuthenticated: true, initializing: false, loading: false, error: null,
  },
};

describe('RecruiterDashboard', () => {
  it('renders welcome message after loading', async () => {
    renderWithProviders(<RecruiterDashboard />, { preloadedState: recruiterAuth });
    await waitFor(() => {
      expect(screen.getByText(/Welcome back, Test/i)).toBeInTheDocument();
    });
  });

  it('shows company name from MSW', async () => {
    renderWithProviders(<RecruiterDashboard />, { preloadedState: recruiterAuth });
    await waitFor(() => {
      expect(screen.getByText('MyCorp')).toBeInTheDocument();
    });
  });

  it('shows stat cards', async () => {
    renderWithProviders(<RecruiterDashboard />, { preloadedState: recruiterAuth });
    await waitFor(() => {
      expect(screen.getByText('Active Jobs')).toBeInTheDocument();
      expect(screen.getByText('Total Applications')).toBeInTheDocument();
      expect(screen.getByText('Job Views')).toBeInTheDocument();
    });
  });

  it('shows Post a Job link', async () => {
    renderWithProviders(<RecruiterDashboard />, { preloadedState: recruiterAuth });
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /Post a Job/i })).toBeInTheDocument();
    });
  });

  it('shows My Jobs section', async () => {
    renderWithProviders(<RecruiterDashboard />, { preloadedState: recruiterAuth });
    await waitFor(() => {
      expect(screen.getByText('My Jobs')).toBeInTheDocument();
    });
  });

  it('shows job title from MSW', async () => {
    renderWithProviders(<RecruiterDashboard />, { preloadedState: recruiterAuth });
    await waitFor(() => {
      expect(screen.getByText('Senior Frontend Dev')).toBeInTheDocument();
    });
  });

  it('shows Recent Applicants section', async () => {
    renderWithProviders(<RecruiterDashboard />, { preloadedState: recruiterAuth });
    await waitFor(() => {
      expect(screen.getByText('Recent Applicants')).toBeInTheDocument();
    });
  });
});
