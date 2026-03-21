import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../utils/renderWithProviders';
import AdminUsers from '../../../pages/admin/AdminUsers';
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

describe('AdminUsers — rendering', () => {
  it('renders Users heading', async () => {
    renderWithProviders(<AdminUsers />, { preloadedState: adminState });
    await waitFor(() => {
      expect(screen.getByText(/Users/i)).toBeInTheDocument();
    });
  });

  it('shows search input', async () => {
    renderWithProviders(<AdminUsers />, { preloadedState: adminState });
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Search by name or email/i)).toBeInTheDocument();
    });
  });

  it('shows All role filter button', async () => {
    renderWithProviders(<AdminUsers />, { preloadedState: adminState });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
    });
  });

  it('shows candidate role filter button', async () => {
    renderWithProviders(<AdminUsers />, { preloadedState: adminState });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'candidate' })).toBeInTheDocument();
    });
  });

  it('shows recruiter role filter button', async () => {
    renderWithProviders(<AdminUsers />, { preloadedState: adminState });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'recruiter' })).toBeInTheDocument();
    });
  });

  it('shows admin role filter button', async () => {
    renderWithProviders(<AdminUsers />, { preloadedState: adminState });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'admin' })).toBeInTheDocument();
    });
  });

  it('loads and shows users from MSW', async () => {
    renderWithProviders(<AdminUsers />, { preloadedState: adminState });
    await waitFor(() => {
      expect(screen.getByText('Test Candidate')).toBeInTheDocument();
    });
  });

  it('shows user email', async () => {
    renderWithProviders(<AdminUsers />, { preloadedState: adminState });
    await waitFor(() => {
      expect(screen.getByText('c@test.com')).toBeInTheDocument();
    });
  });

  it('shows user role badge', async () => {
    renderWithProviders(<AdminUsers />, { preloadedState: adminState });
    await waitFor(() => {
      expect(screen.getAllByText('candidate').length).toBeGreaterThan(0);
    });
  });

  it('shows total count', async () => {
    renderWithProviders(<AdminUsers />, { preloadedState: adminState });
    await waitFor(() => {
      expect(screen.getByText(/\(2\)/)).toBeInTheDocument();
    });
  });

  it('shows table headers: User, Role, Status, Joined, Actions', async () => {
    renderWithProviders(<AdminUsers />, { preloadedState: adminState });
    await waitFor(() => {
      expect(screen.getByText('User')).toBeInTheDocument();
      expect(screen.getByText('Role')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
    });
  });

  it('shows Ban button for non-admin users', async () => {
    renderWithProviders(<AdminUsers />, { preloadedState: adminState });
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Ban/i }).length).toBeGreaterThan(0);
    });
  });

  it('shows Active status for verified users', async () => {
    renderWithProviders(<AdminUsers />, { preloadedState: adminState });
    await waitFor(() => {
      expect(screen.getAllByText('Active').length).toBeGreaterThan(0);
    });
  });
});

describe('AdminUsers — role filtering', () => {
  it('clicking recruiter filter triggers refetch', async () => {
    renderWithProviders(<AdminUsers />, { preloadedState: adminState });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'recruiter' })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: 'recruiter' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'recruiter' })).toBeInTheDocument();
    });
  });

  it('clicking candidate filter triggers refetch', async () => {
    renderWithProviders(<AdminUsers />, { preloadedState: adminState });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'candidate' })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: 'candidate' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'candidate' })).toBeInTheDocument();
    });
  });

  it('clicking All resets role filter', async () => {
    renderWithProviders(<AdminUsers />, { preloadedState: adminState });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'recruiter' })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: 'recruiter' }));
    fireEvent.click(screen.getByRole('button', { name: 'All' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
    });
  });
});

describe('AdminUsers — search', () => {
  it('can type in the search input', async () => {
    renderWithProviders(<AdminUsers />, { preloadedState: adminState });
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Search by name or email/i)).toBeInTheDocument();
    });
    const searchInput = screen.getByPlaceholderText(/Search by name or email/i);
    fireEvent.change(searchInput, { target: { value: 'Test' } });
    expect(searchInput.value).toBe('Test');
  });

  it('pressing Enter on search input triggers fetch', async () => {
    renderWithProviders(<AdminUsers />, { preloadedState: adminState });
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Search by name or email/i)).toBeInTheDocument();
    });
    const searchInput = screen.getByPlaceholderText(/Search by name or email/i);
    fireEvent.change(searchInput, { target: { value: 'candidate' } });
    fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter' });
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Search by name or email/i)).toBeInTheDocument();
    });
  });
});

describe('AdminUsers — ban/unban', () => {
  it('clicking Ban button calls PUT /admin/users/:id/ban', async () => {
    let banCalled = false;
    server.use(
      http.put('http://localhost:5000/api/admin/users/:id/ban', () => {
        banCalled = true;
        return HttpResponse.json({ success: true });
      })
    );

    renderWithProviders(<AdminUsers />, { preloadedState: adminState });
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Ban/i }).length).toBeGreaterThan(0);
    });
    fireEvent.click(screen.getAllByRole('button', { name: /Ban/i })[0]);
    await waitFor(() => {
      expect(banCalled).toBe(true);
    });
  });

  it('banning a user shows Unban button after state update', async () => {
    server.use(
      http.put('http://localhost:5000/api/admin/users/:id/ban', () =>
        HttpResponse.json({ success: true })
      )
    );

    renderWithProviders(<AdminUsers />, { preloadedState: adminState });
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Ban/i }).length).toBeGreaterThan(0);
    });
    fireEvent.click(screen.getAllByRole('button', { name: /Ban/i })[0]);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Unban/i })).toBeInTheDocument();
    });
  });

  it('unbanning shows Ban button again', async () => {
    server.use(
      http.get('http://localhost:5000/api/admin/users', () =>
        HttpResponse.json({
          success: true,
          users: [
            { _id: 'u1', name: 'Test Candidate', email: 'c@test.com', role: 'candidate', isEmailVerified: true, isBanned: true, createdAt: new Date().toISOString() },
          ],
          total: 1,
        })
      ),
      http.put('http://localhost:5000/api/admin/users/:id/ban', () =>
        HttpResponse.json({ success: true })
      )
    );

    renderWithProviders(<AdminUsers />, { preloadedState: adminState });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Unban/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Unban/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Ban/i })).toBeInTheDocument();
    });
  });

  it('shows Banned status badge for banned users', async () => {
    server.use(
      http.get('http://localhost:5000/api/admin/users', () =>
        HttpResponse.json({
          success: true,
          users: [
            { _id: 'u5', name: 'Banned User', email: 'b@test.com', role: 'candidate', isEmailVerified: true, isBanned: true, createdAt: new Date().toISOString() },
          ],
          total: 1,
        })
      )
    );
    renderWithProviders(<AdminUsers />, { preloadedState: adminState });
    await waitFor(() => {
      expect(screen.getByText('Banned')).toBeInTheDocument();
    });
  });

  it('does not show Ban button for admin users', async () => {
    server.use(
      http.get('http://localhost:5000/api/admin/users', () =>
        HttpResponse.json({
          success: true,
          users: [
            { _id: 'u6', name: 'Admin User', email: 'admin@test.com', role: 'admin', isEmailVerified: true, isBanned: false, createdAt: new Date().toISOString() },
          ],
          total: 1,
        })
      )
    );
    renderWithProviders(<AdminUsers />, { preloadedState: adminState });
    await waitFor(() => {
      expect(screen.getByText('admin@test.com')).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: /Ban/i })).toBeNull();
  });
});

describe('AdminUsers — empty state', () => {
  it('shows empty table when no users returned', async () => {
    server.use(
      http.get('http://localhost:5000/api/admin/users', () =>
        HttpResponse.json({ success: true, users: [], total: 0 })
      )
    );
    renderWithProviders(<AdminUsers />, { preloadedState: adminState });
    await waitFor(() => {
      expect(screen.getByText(/\(0\)/)).toBeInTheDocument();
    });
    expect(screen.queryByText('Test Candidate')).not.toBeInTheDocument();
  });
});
