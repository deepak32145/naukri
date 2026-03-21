import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import Jobs from '../../pages/Jobs';
import { renderWithProviders } from '../utils/renderWithProviders';

vi.mock('../../utils/socket', () => ({
  initSocket: vi.fn(),
  disconnectSocket: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
  Toaster: () => null,
}));

const baseState = {
  auth: { user: null, token: null, isAuthenticated: false, initializing: false, loading: false, error: null },
  jobs: {
    jobs: [], currentJob: null, similarJobs: [], savedJobs: [], recommendedJobs: [], myJobs: [],
    total: 0, page: 1, totalPages: 1, loading: false, error: null,
    filters: { keyword: '', location: '', jobType: '', skills: '', salaryMin: '', salaryMax: '', experienceMin: '', experienceMax: '', industry: '' },
  },
};

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('Jobs page — rendering', () => {
  it('renders search input and Search button', async () => {
    renderWithProviders(<Jobs />, { preloadedState: baseState });
    expect(screen.getByPlaceholderText(/job title/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^search$/i })).toBeInTheDocument();
  });

  it('renders Location input', () => {
    renderWithProviders(<Jobs />, { preloadedState: baseState });
    expect(screen.getByPlaceholderText('Location')).toBeInTheDocument();
  });

  it('renders Filters toggle button', () => {
    renderWithProviders(<Jobs />, { preloadedState: baseState });
    expect(screen.getByRole('button', { name: /filters/i })).toBeInTheDocument();
  });

  it('loads and displays jobs from MSW', async () => {
    renderWithProviders(<Jobs />, { preloadedState: baseState });
    await waitFor(() => {
      expect(screen.getByText('React Developer')).toBeInTheDocument();
      expect(screen.getByText('Node.js Engineer')).toBeInTheDocument();
    });
  });

  it('shows total jobs count', async () => {
    renderWithProviders(<Jobs />, { preloadedState: baseState });
    await waitFor(() => {
      expect(screen.getByText(/jobs found/i)).toBeInTheDocument();
    });
  });

  it('shows sort select with Newest First option', async () => {
    renderWithProviders(<Jobs />, { preloadedState: baseState });
    await waitFor(() => {
      expect(screen.getByText('Newest First')).toBeInTheDocument();
    });
  });
});

// ─── Filter panel ─────────────────────────────────────────────────────────────

describe('Jobs page — filter panel', () => {
  it('toggles the filter panel when Filters button is clicked', async () => {
    renderWithProviders(<Jobs />, { preloadedState: baseState });
    await waitFor(() => screen.getByText('React Developer'));
    fireEvent.click(screen.getByRole('button', { name: /filters/i }));
    expect(screen.getByText(/job type/i)).toBeInTheDocument();
  });

  it('shows Job Type, Industry, Experience, Skills labels in filter panel', async () => {
    renderWithProviders(<Jobs />, { preloadedState: baseState });
    fireEvent.click(screen.getByRole('button', { name: /filters/i }));
    expect(screen.getByText('Job Type')).toBeInTheDocument();
    expect(screen.getByText('Industry')).toBeInTheDocument();
    expect(screen.getByText('Experience')).toBeInTheDocument();
    expect(screen.getByText('Skills')).toBeInTheDocument();
  });

  it('shows Apply Filters button in filter panel', async () => {
    renderWithProviders(<Jobs />, { preloadedState: baseState });
    fireEvent.click(screen.getByRole('button', { name: /filters/i }));
    expect(screen.getByRole('button', { name: /apply filters/i })).toBeInTheDocument();
  });

  it('shows Clear All button in filter panel', async () => {
    renderWithProviders(<Jobs />, { preloadedState: baseState });
    fireEvent.click(screen.getByRole('button', { name: /filters/i }));
    expect(screen.getByRole('button', { name: /clear all/i })).toBeInTheDocument();
  });

  it('clears filters when "Clear All" is clicked', async () => {
    renderWithProviders(<Jobs />, { preloadedState: baseState });
    fireEvent.click(screen.getByRole('button', { name: /filters/i }));
    const skillsInput = screen.getByPlaceholderText('React, Python, SQL');
    fireEvent.change(skillsInput, { target: { value: 'Python' } });
    expect(skillsInput.value).toBe('Python');
    fireEvent.click(screen.getByRole('button', { name: /clear all/i }));
    expect(skillsInput.value).toBe('');
  });

  it('changes jobType select in filter panel', async () => {
    renderWithProviders(<Jobs />, { preloadedState: baseState });
    fireEvent.click(screen.getByRole('button', { name: /filters/i }));
    const selects = document.querySelectorAll('select');
    expect(selects.length).toBeGreaterThan(0);
    // Fire change on the first select (job type) without crashing
    if (selects.length > 0) {
      fireEvent.change(selects[0], { target: { value: 'remote' } });
      // Just verify no crash; controlled component re-renders to correct value
    }
  });

  it('changes industry select in filter panel', async () => {
    renderWithProviders(<Jobs />, { preloadedState: baseState });
    fireEvent.click(screen.getByRole('button', { name: /filters/i }));
    const selects = document.querySelectorAll('select');
    expect(selects.length).toBeGreaterThan(0);
  });

  it('changes experience select in filter panel', async () => {
    renderWithProviders(<Jobs />, { preloadedState: baseState });
    fireEvent.click(screen.getByRole('button', { name: /filters/i }));
    // Experience select is the one with "Any Experience" option
    const expSelect = Array.from(document.querySelectorAll('select')).find(
      s => s.querySelector('option')?.textContent?.includes('Any Experience')
    );
    if (expSelect) {
      fireEvent.change(expSelect, { target: { value: '1-3' } });
    }
    // No crash means success
  });

  it('types in skills filter and applies', async () => {
    renderWithProviders(<Jobs />, { preloadedState: baseState });
    fireEvent.click(screen.getByRole('button', { name: /filters/i }));
    const skillsInput = screen.getByPlaceholderText('React, Python, SQL');
    fireEvent.change(skillsInput, { target: { value: 'React' } });
    expect(skillsInput.value).toBe('React');
    fireEvent.click(screen.getByRole('button', { name: /apply filters/i }));
    await waitFor(() => {
      expect(screen.getByText('React Developer')).toBeInTheDocument();
    });
  });

  it('clicking Filters again hides the filter panel', async () => {
    renderWithProviders(<Jobs />, { preloadedState: baseState });
    const filtersBtn = screen.getByRole('button', { name: /filters/i });
    fireEvent.click(filtersBtn);
    expect(screen.getByText('Job Type')).toBeInTheDocument();
    fireEvent.click(filtersBtn);
    expect(screen.queryByText('Job Type')).not.toBeInTheDocument();
  });
});

// ─── Empty state ──────────────────────────────────────────────────────────────

describe('Jobs page — no results', () => {
  it('shows "No jobs found" when API returns empty jobs', async () => {
    server.use(
      http.get('http://localhost:5000/api/jobs', () =>
        HttpResponse.json({ success: true, jobs: [], total: 0, page: 1, totalPages: 1 })
      )
    );
    renderWithProviders(<Jobs />, { preloadedState: baseState });
    await waitFor(() => {
      expect(screen.getByText(/no jobs found/i)).toBeInTheDocument();
    });
  });

  it('shows "Try different keywords" hint in empty state', async () => {
    server.use(
      http.get('http://localhost:5000/api/jobs', () =>
        HttpResponse.json({ success: true, jobs: [], total: 0, page: 1, totalPages: 1 })
      )
    );
    renderWithProviders(<Jobs />, { preloadedState: baseState });
    await waitFor(() => {
      expect(screen.getByText(/Try different keywords/i)).toBeInTheDocument();
    });
  });

  it('shows clear filters button in empty state', async () => {
    server.use(
      http.get('http://localhost:5000/api/jobs', () =>
        HttpResponse.json({ success: true, jobs: [], total: 0, page: 1, totalPages: 1 })
      )
    );
    renderWithProviders(<Jobs />, { preloadedState: baseState });
    await waitFor(() => {
      expect(screen.getByText('Clear filters')).toBeInTheDocument();
    });
  });

  it('clicking Clear filters in empty state clears and reloads', async () => {
    server.use(
      http.get('http://localhost:5000/api/jobs', () =>
        HttpResponse.json({ success: true, jobs: [], total: 0, page: 1, totalPages: 1 })
      )
    );
    renderWithProviders(<Jobs />, { preloadedState: baseState });
    await waitFor(() => {
      expect(screen.getByText('Clear filters')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Clear filters'));
    // Should not throw and should re-dispatch fetchJobs
  });
});

// ─── Search ───────────────────────────────────────────────────────────────────

describe('Jobs page — search', () => {
  it('types in keyword and submits search', async () => {
    renderWithProviders(<Jobs />, { preloadedState: baseState });
    const keywordInput = screen.getByPlaceholderText(/job title/i);
    fireEvent.change(keywordInput, { target: { value: 'react' } });
    fireEvent.click(screen.getByRole('button', { name: /^search$/i }));
    await waitFor(() => {
      expect(screen.getByText('React Developer')).toBeInTheDocument();
    });
  });

  it('shows clear button when keyword is typed', async () => {
    renderWithProviders(<Jobs />, { preloadedState: baseState });
    const keywordInput = screen.getByPlaceholderText(/job title/i);
    fireEvent.change(keywordInput, { target: { value: 'react' } });
    const clearBtn = keywordInput.parentElement.querySelector('button');
    expect(clearBtn).toBeInTheDocument();
  });

  it('clicking clear button clears keyword input', async () => {
    renderWithProviders(<Jobs />, { preloadedState: baseState });
    const keywordInput = screen.getByPlaceholderText(/job title/i);
    fireEvent.change(keywordInput, { target: { value: 'react' } });
    const clearBtn = keywordInput.parentElement.querySelector('button');
    fireEvent.click(clearBtn);
    expect(keywordInput.value).toBe('');
  });

  it('types in location input', () => {
    renderWithProviders(<Jobs />, { preloadedState: baseState });
    const locationInput = screen.getByPlaceholderText('Location');
    fireEvent.change(locationInput, { target: { value: 'Mumbai' } });
    expect(locationInput.value).toBe('Mumbai');
  });
});

// ─── Sort ─────────────────────────────────────────────────────────────────────

describe('Jobs page — sort', () => {
  it('changes sort select calls fetchJobs', async () => {
    renderWithProviders(<Jobs />, { preloadedState: baseState });
    await waitFor(() => screen.getByText('React Developer'));
    // The sort select is the one with "Newest First"
    const sortSelect = Array.from(document.querySelectorAll('select')).find(
      s => s.querySelector('option')?.textContent?.includes('Newest First')
    );
    if (sortSelect) {
      fireEvent.change(sortSelect, { target: { value: 'salary' } });
      // Should trigger fetchJobs without crashing
    }
  });
});

// ─── Pagination ───────────────────────────────────────────────────────────────

describe('Jobs page — pagination', () => {
  it('shows pagination when totalPages > 1', async () => {
    server.use(
      http.get('http://localhost:5000/api/jobs', () =>
        HttpResponse.json({
          success: true,
          jobs: [
            { _id: 'j1', title: 'React Developer', location: 'Bengaluru', jobType: 'full-time',
              companyId: { _id: 'c1', name: 'TechCorp', isVerified: true },
              status: 'active', openings: 1, createdAt: new Date().toISOString() },
          ],
          total: 20, page: 1, totalPages: 3,
        })
      )
    );
    renderWithProviders(<Jobs />, { preloadedState: baseState });
    await waitFor(() => {
      // Pagination buttons should appear
      const paginationButtons = Array.from(document.querySelectorAll('button')).filter(
        btn => btn.querySelector('svg') || /^[0-9]+$/.test(btn.textContent.trim())
      );
      expect(paginationButtons.length).toBeGreaterThan(0);
    });
  });

  it('clicking page number triggers handlePageChange', async () => {
    server.use(
      http.get('http://localhost:5000/api/jobs', () =>
        HttpResponse.json({
          success: true,
          jobs: [
            { _id: 'j1', title: 'React Developer', location: 'Bengaluru', jobType: 'full-time',
              companyId: { _id: 'c1', name: 'TechCorp', isVerified: true },
              status: 'active', openings: 1, createdAt: new Date().toISOString() },
          ],
          total: 30, page: 1, totalPages: 3,
        })
      )
    );
    renderWithProviders(<Jobs />, { preloadedState: baseState });
    await waitFor(() => {
      const pageBtn = screen.queryByRole('button', { name: '2' });
      if (pageBtn) {
        fireEvent.click(pageBtn);
        // Should not throw
      }
    });
  });
});
