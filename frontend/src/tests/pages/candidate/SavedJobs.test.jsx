import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../utils/renderWithProviders';
import SavedJobs from '../../../pages/candidate/SavedJobs';
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

const candidateAuth = {
  auth: { user: { _id: 'u1', name: 'Test Candidate', email: 'c@test.com', role: 'candidate' }, token: 'tok', isAuthenticated: true, initializing: false, loading: false, error: null },
  jobs: { savedJobs: [], loading: false, jobs: [], myJobs: [], recommendedJobs: [], filters: {} },
};

describe('SavedJobs', () => {
  it('renders page heading', () => {
    renderWithProviders(<SavedJobs />, { preloadedState: candidateAuth });
    expect(screen.getAllByText(/Saved Jobs/i).length).toBeGreaterThan(0);
  });

  it('shows empty state when no saved jobs', async () => {
    renderWithProviders(<SavedJobs />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText(/No saved jobs yet/i)).toBeInTheDocument();
    });
  });

  it('shows Browse Jobs link in empty state', async () => {
    renderWithProviders(<SavedJobs />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /Browse Jobs/i })).toBeInTheDocument();
    });
  });

  it('shows saved jobs loaded from MSW', async () => {
    const stateWithSavedJobs = {
      ...candidateAuth,
      jobs: {
        savedJobs: [
          { _id: 'j1', title: 'React Developer', location: 'Bengaluru', jobType: 'full-time',
            companyId: { _id: 'c1', name: 'TechCorp' }, status: 'active', skills: [], openings: 1, createdAt: new Date().toISOString() },
        ],
        loading: false, jobs: [], myJobs: [], recommendedJobs: [], filters: {},
      },
    };
    renderWithProviders(<SavedJobs />, { preloadedState: stateWithSavedJobs });
    await waitFor(() => {
      expect(screen.getByText('React Developer')).toBeInTheDocument();
    });
  });

  it('shows count of saved jobs', async () => {
    const stateWithSavedJobs = {
      ...candidateAuth,
      jobs: {
        savedJobs: [
          { _id: 'j1', title: 'React Developer', location: 'Bengaluru', jobType: 'full-time',
            companyId: { _id: 'c1', name: 'TechCorp' }, status: 'active', skills: [], openings: 1, createdAt: new Date().toISOString() },
        ],
        loading: false, jobs: [], myJobs: [], recommendedJobs: [], filters: {},
      },
    };
    renderWithProviders(<SavedJobs />, { preloadedState: stateWithSavedJobs });
    expect(screen.getByText(/\(1\)/)).toBeInTheDocument();
  });
});
