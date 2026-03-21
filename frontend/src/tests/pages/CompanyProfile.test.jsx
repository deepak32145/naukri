import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders } from '../utils/renderWithProviders';
import CompanyProfile from '../../pages/CompanyProfile';
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
  jobs: { jobs: [], savedJobs: [], loading: false, myJobs: [], recommendedJobs: [], filters: {} },
};

const guestState = {
  auth: { user: null, token: null, isAuthenticated: false, initializing: false, loading: false, error: null },
  jobs: { jobs: [], savedJobs: [], loading: false, myJobs: [], recommendedJobs: [], filters: {} },
};

const renderCompanyProfile = (state = candidateAuth, companyId = 'c1') =>
  renderWithProviders(
    <Routes><Route path="/companies/:id" element={<CompanyProfile />} /></Routes>,
    { preloadedState: state, initialEntries: [`/companies/${companyId}`] }
  );

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('CompanyProfile — rendering', () => {
  it('loads and shows company name', async () => {
    renderCompanyProfile();
    await waitFor(() => {
      expect(screen.getAllByText('TechCorp').length).toBeGreaterThan(0);
    });
  });

  it('shows company location', async () => {
    renderCompanyProfile();
    await waitFor(() => {
      expect(screen.getByText('Bengaluru')).toBeInTheDocument();
    });
  });

  it('shows company industry', async () => {
    renderCompanyProfile();
    await waitFor(() => {
      expect(screen.getByText('Technology')).toBeInTheDocument();
    });
  });

  it('shows About tab by default', async () => {
    renderCompanyProfile();
    await waitFor(() => {
      expect(screen.getAllByText(/about/i).length).toBeGreaterThan(0);
    });
  });

  it('shows company website link', async () => {
    renderCompanyProfile();
    await waitFor(() => {
      expect(screen.getByText(/techcorp\.com/i)).toBeInTheDocument();
    });
  });

  it('shows company description', async () => {
    renderCompanyProfile();
    await waitFor(() => {
      expect(screen.getByText('A tech company')).toBeInTheDocument();
    });
  });
});

// ─── Tabs ────────────────────────────────────────────────────────────────────

describe('CompanyProfile — tabs', () => {
  it('switches to reviews tab when clicked', async () => {
    renderCompanyProfile();
    await waitFor(() => expect(screen.getAllByText('TechCorp').length).toBeGreaterThan(0));
    fireEvent.click(screen.getByRole('button', { name: /reviews/i }));
    await waitFor(() => {
      expect(screen.getByText('Good place')).toBeInTheDocument();
    });
  });

  it('shows review pros and cons', async () => {
    renderCompanyProfile();
    await waitFor(() => expect(screen.getAllByText('TechCorp').length).toBeGreaterThan(0));
    fireEvent.click(screen.getByRole('button', { name: /reviews/i }));
    await waitFor(() => {
      expect(screen.getByText('Great team')).toBeInTheDocument();
      expect(screen.getByText('Long hours')).toBeInTheDocument();
    });
  });

  it('shows Write a Review button for authenticated candidates', async () => {
    renderCompanyProfile(candidateAuth);
    await waitFor(() => expect(screen.getAllByText('TechCorp').length).toBeGreaterThan(0));
    fireEvent.click(screen.getByRole('button', { name: /reviews/i }));
    await waitFor(() => {
      expect(screen.getByText('+ Write a Review')).toBeInTheDocument();
    });
  });

  it('does not show Write a Review for guests', async () => {
    renderCompanyProfile(guestState);
    await waitFor(() => expect(screen.getAllByText('TechCorp').length).toBeGreaterThan(0));
    fireEvent.click(screen.getByRole('button', { name: /reviews/i }));
    expect(screen.queryByText('+ Write a Review')).not.toBeInTheDocument();
  });

  it('shows review form when Write a Review clicked', async () => {
    renderCompanyProfile(candidateAuth);
    await waitFor(() => expect(screen.getAllByText('TechCorp').length).toBeGreaterThan(0));
    fireEvent.click(screen.getByRole('button', { name: /reviews/i }));
    await waitFor(() => fireEvent.click(screen.getByText('+ Write a Review')));
    expect(screen.getByText('Write a Review')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Review title')).toBeInTheDocument();
  });
});

// ─── Review form interactions ─────────────────────────────────────────────────

describe('CompanyProfile — review form', () => {
  const openReviewForm = async () => {
    renderCompanyProfile(candidateAuth);
    await waitFor(() => expect(screen.getAllByText('TechCorp').length).toBeGreaterThan(0));
    fireEvent.click(screen.getByRole('button', { name: /reviews/i }));
    await waitFor(() => fireEvent.click(screen.getByText('+ Write a Review')));
  };

  it('can type in review title input', async () => {
    await openReviewForm();
    const titleInput = screen.getByPlaceholderText('Review title');
    fireEvent.change(titleInput, { target: { value: 'Great company' } });
    expect(titleInput.value).toBe('Great company');
  });

  it('can type in pros textarea', async () => {
    await openReviewForm();
    const prosTextarea = screen.getByPlaceholderText('Pros...');
    fireEvent.change(prosTextarea, { target: { value: 'Great benefits' } });
    expect(prosTextarea.value).toBe('Great benefits');
  });

  it('can type in cons textarea', async () => {
    await openReviewForm();
    const consTextarea = screen.getByPlaceholderText('Cons...');
    fireEvent.change(consTextarea, { target: { value: 'Long hours' } });
    expect(consTextarea.value).toBe('Long hours');
  });

  it('can toggle isAnonymous checkbox', async () => {
    await openReviewForm();
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(true);
  });

  it('cancel button hides review form', async () => {
    await openReviewForm();
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByPlaceholderText('Review title')).not.toBeInTheDocument();
  });

  it('shows error toast when submitting without title', async () => {
    const toast = await import('react-hot-toast');
    await openReviewForm();
    const form = document.querySelector('form');
    fireEvent.submit(form);
    await waitFor(() => {
      expect(toast.default.error).toHaveBeenCalledWith('Please add a title');
    });
  });

  it('submits review successfully', async () => {
    const toast = await import('react-hot-toast');
    server.use(
      http.post('http://localhost:5000/api/companies/c1/reviews', async ({ request }) => {
        const body = await request.json();
        return HttpResponse.json({
          success: true,
          review: { _id: 'rv2', ...body, candidateId: { _id: 'u1', name: 'Test Candidate' }, createdAt: new Date().toISOString() },
        });
      })
    );
    await openReviewForm();
    fireEvent.change(screen.getByPlaceholderText('Review title'), { target: { value: 'Excellent workplace' } });
    const form = document.querySelector('form');
    fireEvent.submit(form);
    await waitFor(() => {
      expect(toast.default.success).toHaveBeenCalledWith('Review submitted!');
    });
  });

  it('shows error toast when review submission fails', async () => {
    const toast = await import('react-hot-toast');
    server.use(
      http.post('http://localhost:5000/api/companies/c1/reviews', () =>
        HttpResponse.json({ success: false, message: 'Already reviewed' }, { status: 400 })
      )
    );
    await openReviewForm();
    fireEvent.change(screen.getByPlaceholderText('Review title'), { target: { value: 'Some title' } });
    const form = document.querySelector('form');
    fireEvent.submit(form);
    await waitFor(() => {
      expect(toast.default.error).toHaveBeenCalled();
    });
  });
});

// ─── Jobs tab ────────────────────────────────────────────────────────────────

describe('CompanyProfile — jobs tab', () => {
  it('switches to jobs tab and shows job listings', async () => {
    renderCompanyProfile();
    await waitFor(() => expect(screen.getAllByText('TechCorp').length).toBeGreaterThan(0));
    fireEvent.click(screen.getByRole('button', { name: /^jobs/i }));
    await waitFor(() => {
      // Jobs tab is active
      expect(screen.getByRole('button', { name: /^jobs/i })).toBeInTheDocument();
    });
  });

  it('shows "No active jobs" when company has no jobs', async () => {
    server.use(
      http.get('http://localhost:5000/api/jobs', () =>
        HttpResponse.json({ success: true, jobs: [], total: 0, page: 1, totalPages: 1 })
      )
    );
    renderCompanyProfile();
    await waitFor(() => expect(screen.getAllByText('TechCorp').length).toBeGreaterThan(0));
    fireEvent.click(screen.getByRole('button', { name: /^jobs/i }));
    await waitFor(() => {
      expect(screen.getByText('No active jobs')).toBeInTheDocument();
    });
  });
});

// ─── Not found ────────────────────────────────────────────────────────────────

describe('CompanyProfile — not found', () => {
  it('shows Company not found for unknown id', async () => {
    renderCompanyProfile(candidateAuth, 'unknown-id');
    await waitFor(() => {
      expect(screen.getByText('Company not found')).toBeInTheDocument();
    });
  });
});
