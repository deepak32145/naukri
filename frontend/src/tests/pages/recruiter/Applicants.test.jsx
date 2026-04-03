import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders } from '../../utils/renderWithProviders';
import Applicants from '../../../pages/recruiter/Applicants';
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

const recruiterAuth = {
  auth: {
    user: { _id: 'u2', name: 'Test Recruiter', email: 'r@test.com', role: 'recruiter' },
    token: 'tok', isAuthenticated: true, initializing: false, loading: false, error: null,
  },
};

const renderApplicants = (state = recruiterAuth, jobId = 'j1') =>
  renderWithProviders(
    <Routes><Route path="/recruiter/jobs/:jobId/applicants" element={<Applicants />} /></Routes>,
    { preloadedState: state, initialEntries: [`/recruiter/jobs/${jobId}/applicants`] }
  );

/** Expand/collapse row details (chevron); distinct from checkbox and other icon-only controls */
const getApplicantExpandButton = () =>
  Array.from(document.querySelectorAll('button')).find(
    (btn) => btn.className.includes('p-1') && btn.className.includes('hover:text-gray-600')
  );

describe('Applicants — rendering', () => {
  it('renders job title and applicants header', async () => {
    renderApplicants();
    await waitFor(() => {
      expect(screen.getByText(/Applicants/i)).toBeInTheDocument();
    });
  });

  it('shows job title from MSW (React Developer)', async () => {
    renderApplicants();
    await waitFor(() => {
      expect(screen.getAllByText(/React Developer/i).length).toBeGreaterThan(0);
    });
  });

  it('shows applicant name from MSW', async () => {
    renderApplicants();
    await waitFor(() => {
      expect(screen.getByText('Test Candidate')).toBeInTheDocument();
    });
  });

  it('shows applicant email', async () => {
    renderApplicants();
    await waitFor(() => {
      expect(screen.getByText('c@test.com')).toBeInTheDocument();
    });
  });

  it('shows total applications count', async () => {
    renderApplicants();
    await waitFor(() => {
      expect(screen.getByText(/1 total application/i)).toBeInTheDocument();
    });
  });

  it('shows filter tabs', async () => {
    renderApplicants();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^All \(\d+\)$/ })).toBeInTheDocument();
    });
  });

  it('shows all status filter buttons', async () => {
    renderApplicants();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /shortlisted/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /hired/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /rejected/i })).toBeInTheDocument();
    });
  });

  it('shows search input', async () => {
    renderApplicants();
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Search applicants/i)).toBeInTheDocument();
    });
  });

  it('shows Schedule Interview button', async () => {
    renderApplicants();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Schedule Interview/i })).toBeInTheDocument();
    });
  });

  it('shows back link to recruiter jobs', async () => {
    renderApplicants();
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /Back to jobs/i })).toBeInTheDocument();
    });
  });

  it('shows Chat link for each applicant', async () => {
    renderApplicants();
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /Chat/i })).toBeInTheDocument();
    });
  });

  it('shows status select dropdown', async () => {
    renderApplicants();
    await waitFor(() => {
      // The select has "Applied" as the option text; check for the select element
      const selects = document.querySelectorAll('select');
      expect(selects.length).toBeGreaterThan(0);
    });
  });

  it('shows candidateProfile headline', async () => {
    renderApplicants();
    await waitFor(() => {
      expect(screen.getByText('React Developer')).toBeInTheDocument();
    });
  });
});

describe('Applicants — empty state', () => {
  it('shows empty state when no applicants', async () => {
    server.use(
      http.get('http://localhost:5000/api/applications/jobs/:jobId/applications', () =>
        HttpResponse.json({ success: true, applications: [] })
      )
    );
    renderApplicants();
    await waitFor(() => {
      expect(screen.getByText(/No applicants found/i)).toBeInTheDocument();
    });
  });
});

describe('Applicants — interview modal', () => {
  it('opens interview modal when Schedule Interview is clicked', async () => {
    renderApplicants();
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Schedule Interview/i }).length).toBeGreaterThan(0);
    });
    fireEvent.click(screen.getAllByRole('button', { name: /Schedule Interview/i })[0]);
    await waitFor(() => {
      expect(screen.getByText(/for Test Candidate/i)).toBeInTheDocument();
    });
  });

  it('modal shows candidate name', async () => {
    renderApplicants();
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Schedule Interview/i }).length).toBeGreaterThan(0);
    });
    fireEvent.click(screen.getAllByRole('button', { name: /Schedule Interview/i })[0]);
    await waitFor(() => {
      expect(screen.getByText(/for Test Candidate/i)).toBeInTheDocument();
    });
  });

  it('modal has Date field', async () => {
    renderApplicants();
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Schedule Interview/i }).length).toBeGreaterThan(0);
    });
    fireEvent.click(screen.getAllByRole('button', { name: /Schedule Interview/i })[0]);
    await waitFor(() => {
      expect(screen.getByText('Date *')).toBeInTheDocument();
    });
  });

  it('modal has Time field', async () => {
    renderApplicants();
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Schedule Interview/i }).length).toBeGreaterThan(0);
    });
    fireEvent.click(screen.getAllByRole('button', { name: /Schedule Interview/i })[0]);
    await waitFor(() => {
      expect(screen.getByText('Time *')).toBeInTheDocument();
    });
  });

  it('modal has Mode select', async () => {
    renderApplicants();
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Schedule Interview/i }).length).toBeGreaterThan(0);
    });
    fireEvent.click(screen.getAllByRole('button', { name: /Schedule Interview/i })[0]);
    await waitFor(() => {
      expect(screen.getByText('Mode')).toBeInTheDocument();
    });
    // The mode select has Online/In-Person/Phone options
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('modal has meeting link field when mode is online', async () => {
    renderApplicants();
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Schedule Interview/i }).length).toBeGreaterThan(0);
    });
    fireEvent.click(screen.getAllByRole('button', { name: /Schedule Interview/i })[0]);
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/https:\/\/meet\.google\.com/i)).toBeInTheDocument();
    });
  });

  it('modal Cancel button closes the modal', async () => {
    renderApplicants();
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Schedule Interview/i }).length).toBeGreaterThan(0);
    });
    fireEvent.click(screen.getAllByRole('button', { name: /Schedule Interview/i })[0]);
    await waitFor(() => {
      expect(screen.getByText(/for Test Candidate/i)).toBeInTheDocument();
    });
    // Click cancel button inside the modal
    const cancelBtns = screen.getAllByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtns[cancelBtns.length - 1]);
    await waitFor(() => {
      expect(screen.queryByText(/for Test Candidate/i)).toBeNull();
    });
  });

  it('scheduling interview calls PUT /applications/:id/interview', async () => {
    let interviewCalled = false;
    server.use(
      http.put('http://localhost:5000/api/applications/:id/interview', () => {
        interviewCalled = true;
        return HttpResponse.json({ success: true });
      })
    );

    renderApplicants();
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Schedule Interview/i }).length).toBeGreaterThan(0);
    });
    fireEvent.click(screen.getAllByRole('button', { name: /Schedule Interview/i })[0]);
    await waitFor(() => {
      expect(screen.getByText('Date *')).toBeInTheDocument();
    });

    // Fill required fields
    const dateInput = document.querySelector('input[type="date"]');
    const timeInput = document.querySelector('input[type="time"]');
    if (dateInput) fireEvent.change(dateInput, { target: { value: '2026-04-01' } });
    if (timeInput) fireEvent.change(timeInput, { target: { value: '10:00' } });

    const submitBtn = screen.getByRole('button', { name: /^Schedule$/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(interviewCalled).toBe(true);
    });
  });
});

describe('Applicants — status change', () => {
  it('changing status dropdown calls PUT /applications/:id/status', async () => {
    let statusPayload = null;
    server.use(
      http.put('http://localhost:5000/api/applications/:id/status', async ({ request }) => {
        statusPayload = await request.json();
        return HttpResponse.json({ success: true });
      })
    );

    renderApplicants();
    await waitFor(() => {
      // The status select renders with "Applied" as text (option text, not value)
      expect(screen.getByDisplayValue('Applied')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByDisplayValue('Applied'), { target: { value: 'shortlisted' } });

    await waitFor(() => {
      expect(statusPayload).not.toBeNull();
    });
    expect(statusPayload.status).toBe('shortlisted');
  });

  it('status is updated in UI after change', async () => {
    server.use(
      http.put('http://localhost:5000/api/applications/:id/status', () =>
        HttpResponse.json({ success: true })
      )
    );

    renderApplicants();
    await waitFor(() => {
      expect(screen.getByDisplayValue('Applied')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByDisplayValue('Applied'), { target: { value: 'hired' } });

    await waitFor(() => {
      expect(screen.getByDisplayValue('hired')).toBeInTheDocument();
    });
  });
});

describe('Applicants — filter by status', () => {
  it('clicking under_review filter shows only matching applicants', async () => {
    server.use(
      http.get('http://localhost:5000/api/applications/jobs/:jobId/applications', () =>
        HttpResponse.json({
          success: true,
          applications: [
            {
              _id: 'a1', status: 'applied', createdAt: new Date().toISOString(),
              candidateId: { _id: 'u1', name: 'Test Candidate', email: 'c@test.com' },
              candidateProfile: { headline: 'React Developer', skills: ['React'], experienceYears: 2, currentLocation: 'Bengaluru' },
            },
            {
              _id: 'a2', status: 'under_review', createdAt: new Date().toISOString(),
              candidateId: { _id: 'u3', name: 'Another Candidate', email: 'ac@test.com' },
              candidateProfile: null,
            },
          ],
        })
      )
    );

    renderApplicants();
    await waitFor(() => {
      expect(screen.getByText('Test Candidate')).toBeInTheDocument();
      expect(screen.getByText('Another Candidate')).toBeInTheDocument();
    });

    // Click under_review filter
    fireEvent.click(screen.getByRole('button', { name: /under review/i }));

    await waitFor(() => {
      expect(screen.queryByText('Test Candidate')).not.toBeInTheDocument();
      expect(screen.getByText('Another Candidate')).toBeInTheDocument();
    });
  });

  it('clicking All filter shows all applicants', async () => {
    renderApplicants();
    await waitFor(() => {
      expect(screen.getByText('Test Candidate')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /^All \(\d+\)$/ }));
    await waitFor(() => {
      expect(screen.getByText('Test Candidate')).toBeInTheDocument();
    });
  });

  it('search input filters applicants by name', async () => {
    server.use(
      http.get('http://localhost:5000/api/applications/jobs/:jobId/applications', () =>
        HttpResponse.json({
          success: true,
          applications: [
            {
              _id: 'a1', status: 'applied', createdAt: new Date().toISOString(),
              candidateId: { _id: 'u1', name: 'Alice Smith', email: 'alice@test.com' },
              candidateProfile: null,
            },
            {
              _id: 'a2', status: 'applied', createdAt: new Date().toISOString(),
              candidateId: { _id: 'u2', name: 'Bob Jones', email: 'bob@test.com' },
              candidateProfile: null,
            },
          ],
        })
      )
    );

    renderApplicants();
    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Jones')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search applicants/i);
    fireEvent.change(searchInput, { target: { value: 'Alice' } });

    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      expect(screen.queryByText('Bob Jones')).not.toBeInTheDocument();
    });
  });
});

describe('Applicants — expand applicant details', () => {
  it('clicking expand chevron shows cover letter', async () => {
    server.use(
      http.get('http://localhost:5000/api/applications/jobs/:jobId/applications', () =>
        HttpResponse.json({
          success: true,
          applications: [
            {
              _id: 'a1', status: 'applied', createdAt: new Date().toISOString(),
              candidateId: { _id: 'u1', name: 'Test Candidate', email: 'c@test.com' },
              candidateProfile: null,
              coverLetter: 'I am an excellent candidate for this role.',
              timeline: [],
            },
          ],
        })
      )
    );

    renderApplicants();
    await waitFor(() => {
      expect(screen.getByText('Test Candidate')).toBeInTheDocument();
    });

    const expandBtn = getApplicantExpandButton();
    expect(expandBtn).toBeTruthy();
    fireEvent.click(expandBtn);
    await waitFor(() => {
      expect(screen.getByText('I am an excellent candidate for this role.')).toBeInTheDocument();
    });
  });

  it('clicking expand chevron again collapses details', async () => {
    server.use(
      http.get('http://localhost:5000/api/applications/jobs/:jobId/applications', () =>
        HttpResponse.json({
          success: true,
          applications: [
            {
              _id: 'a1', status: 'applied', createdAt: new Date().toISOString(),
              candidateId: { _id: 'u1', name: 'Test Candidate', email: 'c@test.com' },
              candidateProfile: null,
              coverLetter: 'My cover letter content here.',
              timeline: [],
            },
          ],
        })
      )
    );

    renderApplicants();
    await waitFor(() => {
      expect(screen.getByText('Test Candidate')).toBeInTheDocument();
    });

    const expandBtn = getApplicantExpandButton();
    expect(expandBtn).toBeTruthy();
    fireEvent.click(expandBtn);
    await waitFor(() => {
      expect(screen.getByText('My cover letter content here.')).toBeInTheDocument();
    });
    fireEvent.click(expandBtn);
    await waitFor(() => {
      expect(screen.queryByText('My cover letter content here.')).not.toBeInTheDocument();
    });
  });
});
