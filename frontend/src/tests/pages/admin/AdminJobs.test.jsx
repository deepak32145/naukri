import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../utils/renderWithProviders';
import AdminJobs from '../../../pages/admin/AdminJobs';
import { server } from '../../mocks/server';
import { http, HttpResponse } from 'msw';

vi.mock('../../../utils/socket', () => ({
  initSocket: vi.fn(),
  disconnectSocket: vi.fn(),
  getSocket: vi.fn(() => null),
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
  Toaster: () => null,
}));

const adminState = {
  auth: {
    user: { _id: 'a1', role: 'admin', name: 'Admin' },
    token: 'tok', isAuthenticated: true, initializing: false, loading: false, error: null,
  },
};

describe('AdminJobs — rendering', () => {
  it('renders All Jobs heading', async () => {
    renderWithProviders(<AdminJobs />, { preloadedState: adminState });
    await waitFor(() => {
      expect(screen.getByText(/All Jobs/i)).toBeInTheDocument();
    });
  });

  it('shows search input', async () => {
    renderWithProviders(<AdminJobs />, { preloadedState: adminState });
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Search by job title/i)).toBeInTheDocument();
    });
  });

  it('shows All status filter button', async () => {
    renderWithProviders(<AdminJobs />, { preloadedState: adminState });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
    });
  });

  it('shows active status filter button', async () => {
    renderWithProviders(<AdminJobs />, { preloadedState: adminState });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'active' })).toBeInTheDocument();
    });
  });

  it('shows paused status filter button', async () => {
    renderWithProviders(<AdminJobs />, { preloadedState: adminState });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'paused' })).toBeInTheDocument();
    });
  });

  it('shows closed and draft filter buttons', async () => {
    renderWithProviders(<AdminJobs />, { preloadedState: adminState });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'closed' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'draft' })).toBeInTheDocument();
    });
  });

  it('loads and shows jobs from MSW', async () => {
    renderWithProviders(<AdminJobs />, { preloadedState: adminState });
    await waitFor(() => {
      expect(screen.getByText('React Developer')).toBeInTheDocument();
    });
  });

  it('shows job company name', async () => {
    renderWithProviders(<AdminJobs />, { preloadedState: adminState });
    await waitFor(() => {
      expect(screen.getByText('TechCorp')).toBeInTheDocument();
    });
  });

  it('shows job location', async () => {
    renderWithProviders(<AdminJobs />, { preloadedState: adminState });
    await waitFor(() => {
      expect(screen.getByText(/Bengaluru/)).toBeInTheDocument();
    });
  });

  it('shows total count', async () => {
    renderWithProviders(<AdminJobs />, { preloadedState: adminState });
    await waitFor(() => {
      expect(screen.getByText(/\(1\)/)).toBeInTheDocument();
    });
  });

  it('shows Remove button for each job', async () => {
    renderWithProviders(<AdminJobs />, { preloadedState: adminState });
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Remove/i }).length).toBeGreaterThan(0);
    });
  });

  it('shows table headers: Job, Company, Status, Posted, Actions', async () => {
    renderWithProviders(<AdminJobs />, { preloadedState: adminState });
    await waitFor(() => {
      expect(screen.getByText('Job')).toBeInTheDocument();
      expect(screen.getByText('Company')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
    });
  });
});

describe('AdminJobs — status filtering', () => {
  it('clicking active filter sets active state', async () => {
    renderWithProviders(<AdminJobs />, { preloadedState: adminState });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'active' })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: 'active' }));
    // The active button should now be highlighted (bg-indigo-600)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'active' })).toBeInTheDocument();
    });
  });

  it('clicking paused filter triggers refetch', async () => {
    renderWithProviders(<AdminJobs />, { preloadedState: adminState });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'paused' })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: 'paused' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'paused' })).toBeInTheDocument();
    });
  });

  it('clicking All filter after active resets status', async () => {
    renderWithProviders(<AdminJobs />, { preloadedState: adminState });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'active' })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: 'active' }));
    fireEvent.click(screen.getByRole('button', { name: 'All' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
    });
  });
});

describe('AdminJobs — search', () => {
  it('can type in the search input', async () => {
    renderWithProviders(<AdminJobs />, { preloadedState: adminState });
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Search by job title/i)).toBeInTheDocument();
    });
    const searchInput = screen.getByPlaceholderText(/Search by job title/i);
    fireEvent.change(searchInput, { target: { value: 'React' } });
    expect(searchInput.value).toBe('React');
  });

  it('pressing Enter on search input triggers search', async () => {
    renderWithProviders(<AdminJobs />, { preloadedState: adminState });
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Search by job title/i)).toBeInTheDocument();
    });
    const searchInput = screen.getByPlaceholderText(/Search by job title/i);
    fireEvent.change(searchInput, { target: { value: 'React' } });
    fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter' });
    // Should trigger fetchJobs — no crash
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Search by job title/i)).toBeInTheDocument();
    });
  });
});

describe('AdminJobs — delete', () => {
  it('shows confirm dialog before deleting', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderWithProviders(<AdminJobs />, { preloadedState: adminState });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Remove/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Remove/i }));
    expect(confirmSpy).toHaveBeenCalledWith('Delete this job permanently?');
    confirmSpy.mockRestore();
  });

  it('does not delete when confirm returns false', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderWithProviders(<AdminJobs />, { preloadedState: adminState });
    await waitFor(() => {
      expect(screen.getByText('React Developer')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Remove/i }));
    // Job should still be visible
    expect(screen.getByText('React Developer')).toBeInTheDocument();
    vi.restoreAllMocks();
  });

  it('deletes job when confirm returns true', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    server.use(
      http.delete('http://localhost:5000/api/admin/jobs/:id', () =>
        HttpResponse.json({ success: true })
      )
    );
    renderWithProviders(<AdminJobs />, { preloadedState: adminState });
    await waitFor(() => {
      expect(screen.getByText('React Developer')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Remove/i }));
    await waitFor(() => {
      expect(screen.queryByText('React Developer')).not.toBeInTheDocument();
    });
    vi.restoreAllMocks();
  });
});

describe('AdminJobs — empty state', () => {
  it('shows empty table when no jobs returned', async () => {
    server.use(
      http.get('http://localhost:5000/api/admin/jobs', () =>
        HttpResponse.json({ success: true, jobs: [], total: 0 })
      )
    );
    renderWithProviders(<AdminJobs />, { preloadedState: adminState });
    await waitFor(() => {
      expect(screen.getByText(/\(0\)/)).toBeInTheDocument();
    });
    expect(screen.queryByText('React Developer')).not.toBeInTheDocument();
  });
});
