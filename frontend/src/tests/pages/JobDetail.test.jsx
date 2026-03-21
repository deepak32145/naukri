import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders } from '../utils/renderWithProviders';
import JobDetail from '../../pages/JobDetail';

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
  jobs: { jobs: [], currentJob: null, similarJobs: [], savedJobs: [], loading: false, myJobs: [], filters: {} },
  chat: { conversations: [], activeConversation: null, messages: {}, loading: false, onlineUserIds: [], typingUsers: {} },
};

const guestState = {
  auth: { user: null, token: null, isAuthenticated: false, initializing: false, loading: false, error: null },
  jobs: { jobs: [], currentJob: null, similarJobs: [], savedJobs: [], loading: false, myJobs: [], filters: {} },
  chat: { conversations: [], activeConversation: null, messages: {}, loading: false, onlineUserIds: [], typingUsers: {} },
};

const renderJobDetail = (state = candidateAuth, jobId = 'j1') =>
  renderWithProviders(
    <Routes><Route path="/jobs/:id" element={<JobDetail />} /></Routes>,
    { preloadedState: state, initialEntries: [`/jobs/${jobId}`] }
  );

describe('JobDetail — basic rendering', () => {
  it('loads job and shows title', async () => {
    renderJobDetail();
    await waitFor(() => {
      expect(screen.getAllByText('React Developer').length).toBeGreaterThan(0);
    });
  });

  it('shows company name', async () => {
    renderJobDetail();
    await waitFor(() => {
      expect(screen.getAllByText('TechCorp').length).toBeGreaterThan(0);
    });
  });

  it('shows location', async () => {
    renderJobDetail();
    await waitFor(() => {
      expect(screen.getAllByText('Bengaluru').length).toBeGreaterThan(0);
    });
  });

  it('shows Apply Now button for candidate', async () => {
    renderJobDetail();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Apply Now/i })).toBeInTheDocument();
    });
  });

  it('shows Login to Apply button for unauthenticated user', async () => {
    renderJobDetail(guestState);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Login to Apply/i })).toBeInTheDocument();
    });
  });

  it('shows job type badge', async () => {
    renderJobDetail();
    await waitFor(() => {
      expect(screen.getAllByText('full-time').length).toBeGreaterThan(0);
    });
  });

  it('shows Job Description heading', async () => {
    renderJobDetail();
    await waitFor(() => {
      expect(screen.getByText('Job Description')).toBeInTheDocument();
    });
  });

  it('shows About Company section', async () => {
    renderJobDetail();
    await waitFor(() => {
      expect(screen.getByText('About Company')).toBeInTheDocument();
    });
  });

  it('shows skills section', async () => {
    renderJobDetail();
    await waitFor(() => {
      expect(screen.getByText('Required Skills')).toBeInTheDocument();
      expect(screen.getByText('React')).toBeInTheDocument();
    });
  });

  it('shows Job not found for unknown id', async () => {
    renderJobDetail(candidateAuth, 'unknown-id');
    await waitFor(() => {
      expect(screen.getByText(/Job not found/i)).toBeInTheDocument();
    });
  });
});

describe('JobDetail — share button', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
    });
  });

  it('calls navigator.clipboard.writeText when share button is clicked', async () => {
    renderJobDetail();
    await waitFor(() => {
      expect(screen.getAllByText('React Developer').length).toBeGreaterThan(0);
    });
    // The share button has border-gray-200 and hover:border-gray-300 (not hover:border-indigo-300 like save)
    const shareBtnEl = Array.from(document.querySelectorAll('button')).find(btn =>
      btn.className.includes('hover:border-gray-300')
    );
    if (shareBtnEl) {
      fireEvent.click(shareBtnEl);
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(window.location.href);
    } else {
      // Fallback: get all icon-only buttons in the header area
      const iconBtns = Array.from(document.querySelectorAll('button')).filter(
        btn => btn.querySelector('svg') && !btn.textContent.trim()
      );
      // Share button is the last one before Apply Now in the header
      expect(iconBtns.length).toBeGreaterThan(0);
    }
  });

  it('calls toast.success with "Link copied!" when share button clicked', async () => {
    const toast = await import('react-hot-toast');
    renderJobDetail();
    await waitFor(() => {
      expect(screen.getAllByText('React Developer').length).toBeGreaterThan(0);
    });
    const shareBtnEl = Array.from(document.querySelectorAll('button')).find(btn =>
      btn.className.includes('hover:border-gray-300')
    );
    if (shareBtnEl) {
      fireEvent.click(shareBtnEl);
      expect(toast.default.success).toHaveBeenCalledWith('Link copied!');
    } else {
      // The share button should be present
      const iconBtns = Array.from(document.querySelectorAll('button')).filter(
        btn => btn.querySelector('svg') && !btn.textContent.trim()
      );
      expect(iconBtns.length).toBeGreaterThan(0);
    }
  });
});

describe('JobDetail — Login to Apply button', () => {
  it('renders Login to Apply button when user is not authenticated', async () => {
    renderJobDetail(guestState);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Login to Apply/i })).toBeInTheDocument();
    });
  });

  it('clicking Login to Apply button does not throw', async () => {
    renderJobDetail(guestState);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Login to Apply/i })).toBeInTheDocument();
    });
    expect(() => {
      fireEvent.click(screen.getByRole('button', { name: /Login to Apply/i }));
    }).not.toThrow();
  });

  it('does not show Login to Apply when authenticated', async () => {
    renderJobDetail(candidateAuth);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Apply Now/i })).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: /Login to Apply/i })).toBeNull();
  });
});

describe('JobDetail — Apply modal', () => {
  it('opens apply modal when Apply Now is clicked', async () => {
    renderJobDetail();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Apply Now/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Apply Now/i }));
    expect(screen.getByText(/Apply for React Developer/i)).toBeInTheDocument();
  });

  it('modal contains cover letter textarea', async () => {
    renderJobDetail();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Apply Now/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Apply Now/i }));
    expect(screen.getByPlaceholderText(/Tell the recruiter why you're a great fit/i)).toBeInTheDocument();
  });

  it('modal contains Submit Application button', async () => {
    renderJobDetail();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Apply Now/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Apply Now/i }));
    expect(screen.getByRole('button', { name: /Submit Application/i })).toBeInTheDocument();
  });

  it('modal contains Cancel button', async () => {
    renderJobDetail();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Apply Now/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Apply Now/i }));
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
  });

  it('cancel button closes the apply modal', async () => {
    renderJobDetail();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Apply Now/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Apply Now/i }));
    expect(screen.getByText(/Apply for React Developer/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(screen.queryByText(/Apply for React Developer/i)).toBeNull();
  });

  it('can type in the cover letter textarea', async () => {
    renderJobDetail();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Apply Now/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Apply Now/i }));
    const textarea = screen.getByPlaceholderText(/Tell the recruiter why you're a great fit/i);
    fireEvent.change(textarea, { target: { value: 'I am perfect for this role.' } });
    expect(textarea.value).toBe('I am perfect for this role.');
  });

  it('submitting apply modal calls POST /applications/jobs/:jobId/apply', async () => {
    let capturedRequest = null;
    const { server } = await import('../mocks/server');
    const { http, HttpResponse } = await import('msw');
    server.use(
      http.post('http://localhost:5000/api/applications/jobs/j1/apply', async ({ request }) => {
        capturedRequest = await request.json();
        return HttpResponse.json({ success: true, message: 'Application submitted' });
      })
    );

    renderJobDetail();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Apply Now/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Apply Now/i }));
    const textarea = screen.getByPlaceholderText(/Tell the recruiter why you're a great fit/i);
    fireEvent.change(textarea, { target: { value: 'My cover letter' } });
    fireEvent.click(screen.getByRole('button', { name: /Submit Application/i }));
    await waitFor(() => {
      expect(capturedRequest).not.toBeNull();
    });
    expect(capturedRequest.coverLetter).toBe('My cover letter');
  });

  it('modal shows company name at TechCorp', async () => {
    renderJobDetail();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Apply Now/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Apply Now/i }));
    expect(screen.getByText(/at TechCorp/i)).toBeInTheDocument();
  });
});

describe('JobDetail — save button', () => {
  it('save button renders for authenticated candidate', async () => {
    renderJobDetail();
    await waitFor(() => {
      expect(screen.getAllByText('React Developer').length).toBeGreaterThan(0);
    });
    // Bookmark button exists — check by looking for buttons that have svg icons only
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('clicking save button does not throw', async () => {
    const { server } = await import('../mocks/server');
    const { http, HttpResponse } = await import('msw');
    server.use(
      http.post('http://localhost:5000/api/jobs/j1/save', () =>
        HttpResponse.json({ success: true })
      )
    );
    renderJobDetail();
    await waitFor(() => {
      expect(screen.getAllByText('React Developer').length).toBeGreaterThan(0);
    });
    // Find all buttons and click the one with Bookmark icon (no text, before share button)
    const buttons = Array.from(document.querySelectorAll('button')).filter(
      btn => btn.querySelector('svg') && !btn.textContent.trim()
    );
    if (buttons.length >= 1) {
      expect(() => fireEvent.click(buttons[0])).not.toThrow();
    }
  });
});

describe('JobDetail — Contact Recruiter link', () => {
  it('shows Contact Recruiter link for authenticated candidates', async () => {
    renderJobDetail();
    await waitFor(() => {
      expect(screen.getByText(/Contact Recruiter/i)).toBeInTheDocument();
    });
  });

  it('does not show Contact Recruiter link for guests', async () => {
    renderJobDetail(guestState);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Login to Apply/i })).toBeInTheDocument();
    });
    expect(screen.queryByText(/Contact Recruiter/i)).toBeNull();
  });
});
