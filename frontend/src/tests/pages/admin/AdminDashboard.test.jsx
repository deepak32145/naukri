import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../utils/renderWithProviders';
import AdminDashboard from '../../../pages/admin/AdminDashboard';

vi.mock('../../../utils/socket', () => ({
  initSocket: vi.fn(),
  disconnectSocket: vi.fn(),
  getSocket: vi.fn(() => null),
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
  Toaster: () => null,
}));

const adminAuth = {
  auth: {
    user: { _id: 'u3', name: 'Admin', email: 'a@test.com', role: 'admin' },
    token: 'tok', isAuthenticated: true, initializing: false, loading: false, error: null,
  },
};

describe('AdminDashboard', () => {
  it('renders Admin Dashboard heading', async () => {
    renderWithProviders(<AdminDashboard />, { preloadedState: adminAuth });
    await waitFor(() => {
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    });
  });

  it('shows Total Users stat card', async () => {
    renderWithProviders(<AdminDashboard />, { preloadedState: adminAuth });
    await waitFor(() => {
      expect(screen.getByText('Total Users')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
    });
  });

  it('shows Total Jobs stat card', async () => {
    renderWithProviders(<AdminDashboard />, { preloadedState: adminAuth });
    await waitFor(() => {
      expect(screen.getByText('Total Jobs')).toBeInTheDocument();
      expect(screen.getByText('80')).toBeInTheDocument();
    });
  });

  it('shows Companies stat card', async () => {
    renderWithProviders(<AdminDashboard />, { preloadedState: adminAuth });
    await waitFor(() => {
      expect(screen.getByText('Companies')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
    });
  });

  it('shows Candidates count', async () => {
    renderWithProviders(<AdminDashboard />, { preloadedState: adminAuth });
    await waitFor(() => {
      expect(screen.getByText('Candidates')).toBeInTheDocument();
    });
  });

  it('shows Recruiters count', async () => {
    renderWithProviders(<AdminDashboard />, { preloadedState: adminAuth });
    await waitFor(() => {
      expect(screen.getByText('Recruiters')).toBeInTheDocument();
    });
  });

  it('shows Recent Users section', async () => {
    renderWithProviders(<AdminDashboard />, { preloadedState: adminAuth });
    await waitFor(() => {
      expect(screen.getByText('Recent Users')).toBeInTheDocument();
    });
  });

  it('shows recent user from MSW', async () => {
    renderWithProviders(<AdminDashboard />, { preloadedState: adminAuth });
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
  });

  it('shows Recent Jobs section', async () => {
    renderWithProviders(<AdminDashboard />, { preloadedState: adminAuth });
    await waitFor(() => {
      expect(screen.getByText('Recent Jobs')).toBeInTheDocument();
    });
  });

  it('shows recent job from MSW', async () => {
    renderWithProviders(<AdminDashboard />, { preloadedState: adminAuth });
    await waitFor(() => {
      expect(screen.getByText('React Developer')).toBeInTheDocument();
    });
  });
});
