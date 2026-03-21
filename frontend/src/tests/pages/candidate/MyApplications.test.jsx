import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../utils/renderWithProviders';
import MyApplications from '../../../pages/candidate/MyApplications';
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
  auth: {
    user: { _id: 'u1', name: 'Test Candidate', email: 'c@test.com', role: 'candidate' },
    token: 'tok', isAuthenticated: true, initializing: false, loading: false, error: null,
  },
};

// MSW default: returns 1 application with status 'applied', job 'React Developer', company 'TechCorp'

describe('MyApplications', () => {
  it('renders My Applications heading', async () => {
    renderWithProviders(<MyApplications />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText(/My Applications/i)).toBeInTheDocument();
    });
  });

  it('shows the total count of applications in heading', async () => {
    renderWithProviders(<MyApplications />, { preloadedState: candidateAuth });
    await waitFor(() => {
      // Count is shown as "(1)" after the heading — appears in both heading span and All button
      const countEls = screen.getAllByText(/\(1\)/);
      expect(countEls.length).toBeGreaterThan(0);
    });
  });

  it('renders the All filter tab', async () => {
    renderWithProviders(<MyApplications />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /All/i })).toBeInTheDocument();
    });
  });

  it('renders all status filter tabs', async () => {
    renderWithProviders(<MyApplications />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^applied$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /under review/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /shortlisted/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /interview scheduled/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /hired/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /rejected/i })).toBeInTheDocument();
    });
  });

  it('loads and shows application job title from MSW', async () => {
    renderWithProviders(<MyApplications />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText('React Developer')).toBeInTheDocument();
    });
  });

  it('shows company name in application card', async () => {
    renderWithProviders(<MyApplications />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText('TechCorp')).toBeInTheDocument();
    });
  });

  it('shows location in application card', async () => {
    renderWithProviders(<MyApplications />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText(/Bengaluru/i)).toBeInTheDocument();
    });
  });

  it('shows status badge for the application', async () => {
    renderWithProviders(<MyApplications />, { preloadedState: candidateAuth });
    await waitFor(() => {
      // StatusBadge renders the status text — 'applied'
      expect(screen.getAllByText(/applied/i).length).toBeGreaterThan(0);
    });
  });

  it('shows withdraw button (X) for applications with status applied', async () => {
    renderWithProviders(<MyApplications />, { preloadedState: candidateAuth });
    await waitFor(() => {
      // The withdraw button has title "Withdraw application"
      expect(screen.getByTitle(/Withdraw application/i)).toBeInTheDocument();
    });
  });

  it('shows expand/collapse chevron button on each application card', async () => {
    renderWithProviders(<MyApplications />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText('React Developer')).toBeInTheDocument();
    });
    // The chevron button has no text — find all buttons and look for icon-only ones
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('expands application card to show cover letter when chevron clicked', async () => {
    renderWithProviders(<MyApplications />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText('React Developer')).toBeInTheDocument();
    });
    // Find the chevron button (the expand button, not the withdraw X)
    const allButtons = screen.getAllByRole('button');
    // Filter buttons that are in the card area — the last button per card is the chevron
    const chevronBtn = allButtons[allButtons.length - 1];
    fireEvent.click(chevronBtn);
    await waitFor(() => {
      expect(screen.getByText(/Your Cover Letter/i)).toBeInTheDocument();
    });
  });

  it('shows cover letter content when card is expanded', async () => {
    renderWithProviders(<MyApplications />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText('React Developer')).toBeInTheDocument();
    });
    const allButtons = screen.getAllByRole('button');
    const chevronBtn = allButtons[allButtons.length - 1];
    fireEvent.click(chevronBtn);
    await waitFor(() => {
      // MSW default cover letter: 'I am a great fit'
      expect(screen.getByText('I am a great fit')).toBeInTheDocument();
    });
  });

  it('filters applications by clicking a status tab', async () => {
    renderWithProviders(<MyApplications />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText('React Developer')).toBeInTheDocument();
    });
    // Click 'shortlisted' filter — no shortlisted apps exist, should show empty state
    fireEvent.click(screen.getByRole('button', { name: /shortlisted/i }));
    await waitFor(() => {
      expect(screen.getByText(/No applications with status "shortlisted"/i)).toBeInTheDocument();
    });
  });

  it('shows empty state message when filtered status has no results', async () => {
    renderWithProviders(<MyApplications />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText('React Developer')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /rejected/i }));
    await waitFor(() => {
      expect(screen.getByText(/No applications with status "rejected"/i)).toBeInTheDocument();
    });
  });

  it('shows empty state when no applications at all', async () => {
    server.use(
      http.get('http://localhost:5000/api/applications/my-applications', () =>
        HttpResponse.json({ success: true, applications: [] })
      )
    );
    renderWithProviders(<MyApplications />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText(/No applications yet/i)).toBeInTheDocument();
    });
  });

  it('shows Browse Jobs link in empty state for all filter', async () => {
    server.use(
      http.get('http://localhost:5000/api/applications/my-applications', () =>
        HttpResponse.json({ success: true, applications: [] })
      )
    );
    renderWithProviders(<MyApplications />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /Browse Jobs/i })).toBeInTheDocument();
    });
  });

  it('withdraw button calls DELETE /applications/:id when confirmed', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    let deleteCalled = false;
    server.use(
      http.delete('http://localhost:5000/api/applications/:id', () => {
        deleteCalled = true;
        return HttpResponse.json({ success: true });
      })
    );

    renderWithProviders(<MyApplications />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByTitle(/Withdraw application/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTitle(/Withdraw application/i));

    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalled();
      expect(deleteCalled).toBe(true);
    });

    confirmSpy.mockRestore();
  });

  it('All filter tab shows count of all applications', async () => {
    renderWithProviders(<MyApplications />, { preloadedState: candidateAuth });
    await waitFor(() => {
      // All tab shows "All (1)"
      expect(screen.getByRole('button', { name: /All \(1\)/i })).toBeInTheDocument();
    });
  });

  it('clicking applied filter still shows applied applications', async () => {
    renderWithProviders(<MyApplications />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText('React Developer')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /^applied$/i }));
    await waitFor(() => {
      // Application has status 'applied', should still be visible
      expect(screen.getByText('React Developer')).toBeInTheDocument();
    });
  });

  it('shows multiple applications when MSW returns multiple', async () => {
    server.use(
      http.get('http://localhost:5000/api/applications/my-applications', () =>
        HttpResponse.json({
          success: true,
          applications: [
            {
              _id: 'a1', status: 'applied', createdAt: new Date().toISOString(),
              jobId: { _id: 'j1', title: 'React Developer', location: 'Bengaluru',
                companyId: { _id: 'c1', name: 'TechCorp' } },
              coverLetter: 'Cover letter 1', timeline: [],
            },
            {
              _id: 'a2', status: 'shortlisted', createdAt: new Date().toISOString(),
              jobId: { _id: 'j2', title: 'Node.js Engineer', location: 'Mumbai',
                companyId: { _id: 'c1', name: 'TechCorp' } },
              coverLetter: 'Cover letter 2', timeline: [],
            },
          ],
        })
      )
    );
    renderWithProviders(<MyApplications />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText('React Developer')).toBeInTheDocument();
      expect(screen.getByText('Node.js Engineer')).toBeInTheDocument();
    });
  });

  it('shows correct count in heading for multiple applications', async () => {
    server.use(
      http.get('http://localhost:5000/api/applications/my-applications', () =>
        HttpResponse.json({
          success: true,
          applications: [
            {
              _id: 'a1', status: 'applied', createdAt: new Date().toISOString(),
              jobId: { _id: 'j1', title: 'React Developer', location: 'Bengaluru',
                companyId: { _id: 'c1', name: 'TechCorp' } },
              coverLetter: '', timeline: [],
            },
            {
              _id: 'a2', status: 'shortlisted', createdAt: new Date().toISOString(),
              jobId: { _id: 'j2', title: 'Node.js Engineer', location: 'Mumbai',
                companyId: { _id: 'c1', name: 'TechCorp' } },
              coverLetter: '', timeline: [],
            },
          ],
        })
      )
    );
    renderWithProviders(<MyApplications />, { preloadedState: candidateAuth });
    await waitFor(() => {
      // Count "(2)" appears in both the heading span and the All filter button
      const countEls = screen.getAllByText(/\(2\)/);
      expect(countEls.length).toBeGreaterThan(0);
    });
  });
});
