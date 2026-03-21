import { describe, it, expect, vi, beforeAll } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../utils/renderWithProviders';
import MyJobs from '../../../pages/recruiter/MyJobs';
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

beforeAll(() => {
  server.use(
    http.put('http://localhost:5000/api/jobs/:id/status', () =>
      HttpResponse.json({ success: true })
    ),
    http.delete('http://localhost:5000/api/jobs/:id', () =>
      HttpResponse.json({ success: true })
    )
  );
});

const recruiterAuth = {
  auth: {
    user: { _id: 'u2', name: 'Test Recruiter', email: 'r@test.com', role: 'recruiter' },
    token: 'tok', isAuthenticated: true, initializing: false, loading: false, error: null,
  },
  jobs: { myJobs: [], loading: false, jobs: [], savedJobs: [], recommendedJobs: [], filters: {} },
};

const stateWithJobs = {
  auth: {
    user: { _id: 'u2', role: 'recruiter' },
    token: 'tok', isAuthenticated: true, initializing: false, loading: false, error: null,
  },
  jobs: {
    myJobs: [
      {
        _id: 'j3', title: 'Senior Frontend Dev', location: 'Delhi', jobType: 'full-time',
        experienceMin: 2, experienceMax: 5, status: 'active', applicationsCount: 5, viewsCount: 100,
        companyId: { _id: 'c2', name: 'MyCorp' }, createdAt: new Date().toISOString(),
      },
    ],
    loading: false, jobs: [], savedJobs: [], recommendedJobs: [], filters: {},
  },
};

const stateWithPausedJob = {
  auth: {
    user: { _id: 'u2', role: 'recruiter' },
    token: 'tok', isAuthenticated: true, initializing: false, loading: false, error: null,
  },
  jobs: {
    myJobs: [
      {
        _id: 'j3', title: 'Senior Frontend Dev', location: 'Delhi', jobType: 'full-time',
        experienceMin: 2, experienceMax: 5, status: 'paused', applicationsCount: 2, viewsCount: 50,
        companyId: { _id: 'c2', name: 'MyCorp' }, createdAt: new Date().toISOString(),
      },
    ],
    loading: false, jobs: [], savedJobs: [], recommendedJobs: [], filters: {},
  },
};

describe('MyJobs', () => {
  it('renders My Jobs heading', async () => {
    renderWithProviders(<MyJobs />, { preloadedState: recruiterAuth });
    await waitFor(() => {
      expect(screen.getByText('My Jobs')).toBeInTheDocument();
    });
  });

  it('shows Post New Job link', async () => {
    renderWithProviders(<MyJobs />, { preloadedState: recruiterAuth });
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /Post New Job/i })).toBeInTheDocument();
    });
  });

  it('shows jobs from redux store', async () => {
    renderWithProviders(<MyJobs />, { preloadedState: stateWithJobs });
    await waitFor(() => {
      expect(screen.getByText('Senior Frontend Dev')).toBeInTheDocument();
    });
  });

  it('shows job title in the job card', async () => {
    renderWithProviders(<MyJobs />, { preloadedState: stateWithJobs });
    await waitFor(() => {
      expect(screen.getByText('Senior Frontend Dev')).toBeInTheDocument();
    });
  });

  it('shows active count badge in summary', async () => {
    renderWithProviders(<MyJobs />, { preloadedState: stateWithJobs });
    await waitFor(() => {
      expect(screen.getByText(/1 active/i)).toBeInTheDocument();
    });
  });

  it('shows Applicants link for each job', async () => {
    renderWithProviders(<MyJobs />, { preloadedState: stateWithJobs });
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /Applicants/i })).toBeInTheDocument();
    });
  });

  it('shows Edit link for each job', async () => {
    renderWithProviders(<MyJobs />, { preloadedState: stateWithJobs });
    await waitFor(() => {
      // Edit is a link with an Edit icon (aria-label not set, find by href pattern)
      const editLinks = screen.getAllByRole('link');
      const editLink = editLinks.find(l => l.getAttribute('href')?.includes('/edit'));
      expect(editLink).toBeTruthy();
    });
  });

  it('opens dropdown menu when MoreVertical button is clicked', async () => {
    renderWithProviders(<MyJobs />, { preloadedState: stateWithJobs });
    await waitFor(() => {
      expect(screen.getByText('Senior Frontend Dev')).toBeInTheDocument();
    });
    // Click the MoreVertical button (the three-dots menu)
    const menuButtons = screen.getAllByRole('button');
    // The MoreVertical button has no text, find by position — it's the last button per job row
    const moreVertButton = menuButtons.find(btn =>
      btn.className.includes('border-gray-200') && !btn.textContent.trim()
    );
    if (moreVertButton) {
      fireEvent.click(moreVertButton);
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Pause/i })).toBeInTheDocument();
      });
    }
  });

  it('dropdown shows Pause button for active job', async () => {
    renderWithProviders(<MyJobs />, { preloadedState: stateWithJobs });
    await waitFor(() => {
      expect(screen.getByText('Senior Frontend Dev')).toBeInTheDocument();
    });
    // Open dropdown
    const allButtons = screen.getAllByRole('button');
    const moreBtn = allButtons[allButtons.length - 1];
    fireEvent.click(moreBtn);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Pause/i })).toBeInTheDocument();
    });
  });

  it('clicking Pause dispatches status change PUT /jobs/j3/status', async () => {
    let putCalled = false;
    server.use(
      http.put('http://localhost:5000/api/jobs/:id/status', () => {
        putCalled = true;
        return HttpResponse.json({ success: true });
      })
    );

    renderWithProviders(<MyJobs />, { preloadedState: stateWithJobs });
    await waitFor(() => {
      expect(screen.getByText('Senior Frontend Dev')).toBeInTheDocument();
    });

    const allButtons = screen.getAllByRole('button');
    const moreBtn = allButtons[allButtons.length - 1];
    fireEvent.click(moreBtn);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Pause/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Pause/i }));

    await waitFor(() => {
      expect(putCalled).toBe(true);
    });
  });

  it('dropdown shows Delete button', async () => {
    renderWithProviders(<MyJobs />, { preloadedState: stateWithJobs });
    await waitFor(() => {
      expect(screen.getByText('Senior Frontend Dev')).toBeInTheDocument();
    });
    const allButtons = screen.getAllByRole('button');
    const moreBtn = allButtons[allButtons.length - 1];
    fireEvent.click(moreBtn);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Delete/i })).toBeInTheDocument();
    });
  });

  it('clicking Delete calls confirm() and dispatches delete', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    let deleteCalled = false;
    server.use(
      http.delete('http://localhost:5000/api/jobs/:id', () => {
        deleteCalled = true;
        return HttpResponse.json({ success: true });
      })
    );

    renderWithProviders(<MyJobs />, { preloadedState: stateWithJobs });
    await waitFor(() => {
      expect(screen.getByText('Senior Frontend Dev')).toBeInTheDocument();
    });

    const allButtons = screen.getAllByRole('button');
    const moreBtn = allButtons[allButtons.length - 1];
    fireEvent.click(moreBtn);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Delete/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Delete/i }));

    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalled();
      expect(deleteCalled).toBe(true);
    });

    confirmSpy.mockRestore();
  });

  it('shows empty state when no jobs in redux store', async () => {
    renderWithProviders(<MyJobs />, { preloadedState: recruiterAuth });
    await waitFor(() => {
      expect(screen.getByText(/No jobs posted yet/i)).toBeInTheDocument();
    });
  });

  it('shows job location and type in job card', async () => {
    renderWithProviders(<MyJobs />, { preloadedState: stateWithJobs });
    await waitFor(() => {
      expect(screen.getByText(/Delhi/i)).toBeInTheDocument();
    });
  });

  it('shows applicants count in job card', async () => {
    renderWithProviders(<MyJobs />, { preloadedState: stateWithJobs });
    await waitFor(() => {
      expect(screen.getByText(/5 applicants/i)).toBeInTheDocument();
    });
  });

  it('shows Activate button for paused job in dropdown', async () => {
    // Override MSW to return a paused job so state doesn't get overwritten
    server.use(
      http.get('http://localhost:5000/api/jobs/recruiter/my-jobs', () =>
        HttpResponse.json({
          success: true,
          jobs: [
            {
              _id: 'j3', title: 'Senior Frontend Dev', location: 'Delhi', jobType: 'full-time',
              experienceMin: 2, experienceMax: 5, status: 'paused', applicationsCount: 2, viewsCount: 50,
              companyId: { _id: 'c2', name: 'MyCorp' }, createdAt: new Date().toISOString(),
            },
          ],
        })
      )
    );
    renderWithProviders(<MyJobs />, { preloadedState: stateWithPausedJob });
    await waitFor(() => {
      expect(screen.getByText('Senior Frontend Dev')).toBeInTheDocument();
    });
    const allButtons = screen.getAllByRole('button');
    const moreBtn = allButtons[allButtons.length - 1];
    fireEvent.click(moreBtn);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Activate/i })).toBeInTheDocument();
    });
  });

  it('shows views count in job card', async () => {
    renderWithProviders(<MyJobs />, { preloadedState: stateWithJobs });
    await waitFor(() => {
      expect(screen.getByText(/100 views/i)).toBeInTheDocument();
    });
  });
});
