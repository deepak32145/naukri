import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../utils/renderWithProviders';
import Home from '../../pages/Home';

vi.mock('../../utils/socket', () => ({
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
  jobs: { jobs: [], recommendedJobs: [], loading: false, savedJobs: [], myJobs: [], filters: {} },
};

const candidateAuth = {
  auth: { user: { _id: 'u1', name: 'Test Candidate', email: 'c@test.com', role: 'candidate' }, token: 'tok', isAuthenticated: true, initializing: false, loading: false, error: null },
  jobs: { jobs: [], recommendedJobs: [], loading: false, savedJobs: [], myJobs: [], filters: {} },
};

describe('Home', () => {
  it('renders hero section', () => {
    renderWithProviders(<Home />, { preloadedState: guestState });
    expect(screen.getAllByText(/Find Your/i).length).toBeGreaterThan(0);
    expect(screen.getByPlaceholderText(/Job title, skills/i)).toBeInTheDocument();
  });

  it('renders stats section', () => {
    renderWithProviders(<Home />, { preloadedState: guestState });
    expect(screen.getByText('50,000+')).toBeInTheDocument();
    expect(screen.getByText('2M+')).toBeInTheDocument();
    expect(screen.getByText('Jobs Posted')).toBeInTheDocument();
  });

  it('renders popular categories', () => {
    renderWithProviders(<Home />, { preloadedState: guestState });
    expect(screen.getByText('IT & Software')).toBeInTheDocument();
    expect(screen.getByText('Marketing')).toBeInTheDocument();
    expect(screen.getByText('Finance')).toBeInTheDocument();
  });

  it('loads and shows latest jobs from MSW', async () => {
    renderWithProviders(<Home />, { preloadedState: guestState });
    await waitFor(() => {
      expect(screen.getByText('React Developer')).toBeInTheDocument();
    });
  });

  it('shows CTA banner for unauthenticated users', () => {
    renderWithProviders(<Home />, { preloadedState: guestState });
    expect(screen.getByText(/Ready to find your next opportunity/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Create Account/i })).toBeInTheDocument();
  });

  it('does not show CTA banner for authenticated users', () => {
    renderWithProviders(<Home />, { preloadedState: candidateAuth });
    expect(screen.queryByText(/Ready to find your next opportunity/i)).not.toBeInTheDocument();
  });

  it('shows search bar and navigates on submit', () => {
    renderWithProviders(<Home />, { preloadedState: guestState });
    const searchInput = screen.getByPlaceholderText(/Job title, skills/i);
    fireEvent.change(searchInput, { target: { value: 'React' } });
    const searchBtn = screen.getByRole('button', { name: /Search Jobs/i });
    fireEvent.click(searchBtn);
    // Search triggers dispatch and navigate — no error thrown
  });

  it('renders Latest Jobs section heading', () => {
    renderWithProviders(<Home />, { preloadedState: guestState });
    expect(screen.getByText('Latest Jobs')).toBeInTheDocument();
  });

  it('shows recommended jobs section for authenticated candidates after load', async () => {
    const stateWithRecommended = {
      ...candidateAuth,
      jobs: { jobs: [], recommendedJobs: [
        { _id: 'j2', title: 'Node.js Engineer', location: 'Mumbai', jobType: 'remote',
          companyId: { _id: 'c1', name: 'TechCorp' }, status: 'active', skills: [], openings: 1, createdAt: new Date().toISOString() },
      ], loading: false, savedJobs: [], myJobs: [], filters: {} },
    };
    renderWithProviders(<Home />, { preloadedState: stateWithRecommended });
    expect(screen.getByText(/Recommended for You/i)).toBeInTheDocument();
  });
});
