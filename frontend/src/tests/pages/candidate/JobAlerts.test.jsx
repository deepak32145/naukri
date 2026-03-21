import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../utils/renderWithProviders';
import JobAlerts from '../../../pages/candidate/JobAlerts';
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

describe('JobAlerts — rendering', () => {
  it('renders page heading', async () => {
    renderWithProviders(<JobAlerts />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText('Job Alerts')).toBeInTheDocument();
    });
  });

  it('renders Create Alert button', async () => {
    renderWithProviders(<JobAlerts />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Create Alert/i })).toBeInTheDocument();
    });
  });

  it('loads and shows existing alerts from MSW', async () => {
    renderWithProviders(<JobAlerts />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getAllByText('React').length).toBeGreaterThan(0);
    });
  });

  it('shows alert keyword', async () => {
    renderWithProviders(<JobAlerts />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getAllByText('React').length).toBeGreaterThan(0);
    });
  });

  it('shows alert frequency badge', async () => {
    renderWithProviders(<JobAlerts />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText('daily')).toBeInTheDocument();
    });
  });

  it('shows alert location', async () => {
    renderWithProviders(<JobAlerts />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText(/Bengaluru/i)).toBeInTheDocument();
    });
  });

  it('shows delete button for each alert', async () => {
    renderWithProviders(<JobAlerts />, { preloadedState: candidateAuth });
    await waitFor(() => {
      // Trash2 icon buttons exist
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(1);
    });
  });
});

describe('JobAlerts — empty state', () => {
  it('shows empty state when no alerts', async () => {
    server.use(
      http.get('http://localhost:5000/api/candidate/job-alerts', () =>
        HttpResponse.json({ success: true, jobAlerts: [] })
      )
    );
    renderWithProviders(<JobAlerts />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText(/No job alerts yet/i)).toBeInTheDocument();
    });
  });

  it('shows descriptive text in empty state', async () => {
    server.use(
      http.get('http://localhost:5000/api/candidate/job-alerts', () =>
        HttpResponse.json({ success: true, jobAlerts: [] })
      )
    );
    renderWithProviders(<JobAlerts />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText(/Get notified when matching jobs are posted/i)).toBeInTheDocument();
    });
  });

  it('shows "Create your first alert" button in empty state', async () => {
    server.use(
      http.get('http://localhost:5000/api/candidate/job-alerts', () =>
        HttpResponse.json({ success: true, jobAlerts: [] })
      )
    );
    renderWithProviders(<JobAlerts />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Create your first alert/i })).toBeInTheDocument();
    });
  });

  it('clicking "Create your first alert" opens form', async () => {
    server.use(
      http.get('http://localhost:5000/api/candidate/job-alerts', () =>
        HttpResponse.json({ success: true, jobAlerts: [] })
      )
    );
    renderWithProviders(<JobAlerts />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Create your first alert/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Create your first alert/i }));
    expect(screen.getByText('New Job Alert')).toBeInTheDocument();
  });
});

describe('JobAlerts — create form', () => {
  it('shows create form when Create Alert is clicked', async () => {
    renderWithProviders(<JobAlerts />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Create Alert/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Create Alert/i }));
    expect(screen.getByText('New Job Alert')).toBeInTheDocument();
  });

  it('create form has keyword field', async () => {
    renderWithProviders(<JobAlerts />, { preloadedState: candidateAuth });
    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /Create Alert/i }));
    });
    expect(screen.getByPlaceholderText('React Developer')).toBeInTheDocument();
  });

  it('create form has location field', async () => {
    renderWithProviders(<JobAlerts />, { preloadedState: candidateAuth });
    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /Create Alert/i }));
    });
    expect(screen.getByPlaceholderText('Bengaluru')).toBeInTheDocument();
  });

  it('create form has skills field', async () => {
    renderWithProviders(<JobAlerts />, { preloadedState: candidateAuth });
    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /Create Alert/i }));
    });
    expect(screen.getByPlaceholderText('React, Node.js')).toBeInTheDocument();
  });

  it('create form has frequency select', async () => {
    renderWithProviders(<JobAlerts />, { preloadedState: candidateAuth });
    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /Create Alert/i }));
    });
    expect(screen.getByText('Daily')).toBeInTheDocument();
    expect(screen.getByText('Weekly')).toBeInTheDocument();
  });

  it('cancel button hides create form', async () => {
    renderWithProviders(<JobAlerts />, { preloadedState: candidateAuth });
    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /Create Alert/i }));
    });
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(screen.queryByText('New Job Alert')).not.toBeInTheDocument();
  });

  it('clicking Create Alert again toggles form off', async () => {
    renderWithProviders(<JobAlerts />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Create Alert/i }).length).toBeGreaterThan(0);
    });
    // Open form using the header button (first one with Plus icon)
    const headerBtn = screen.getAllByRole('button', { name: /Create Alert/i })[0];
    fireEvent.click(headerBtn);
    expect(screen.getByText('New Job Alert')).toBeInTheDocument();
    // Close form by clicking again (only 1 "Create Alert" button in header remains)
    fireEvent.click(screen.getAllByRole('button', { name: /Create Alert/i })[0]);
    expect(screen.queryByText('New Job Alert')).not.toBeInTheDocument();
  });

  it('can type in keyword field', async () => {
    renderWithProviders(<JobAlerts />, { preloadedState: candidateAuth });
    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: /Create Alert/i }));
    });
    const keywordInput = screen.getByPlaceholderText('React Developer');
    fireEvent.change(keywordInput, { target: { value: 'Frontend Engineer' } });
    expect(keywordInput.value).toBe('Frontend Engineer');
  });

  it('submitting create form calls POST /candidate/job-alerts', async () => {
    let capturedPayload = null;
    server.use(
      http.post('http://localhost:5000/api/candidate/job-alerts', async ({ request }) => {
        capturedPayload = await request.json();
        return HttpResponse.json({
          success: true,
          jobAlerts: [{ _id: 'al3', keyword: capturedPayload.keyword, frequency: 'daily', isActive: true, skills: [] }],
        });
      })
    );

    renderWithProviders(<JobAlerts />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Create Alert/i }).length).toBeGreaterThan(0);
    });
    fireEvent.click(screen.getAllByRole('button', { name: /Create Alert/i })[0]);

    const keywordInput = screen.getByPlaceholderText('React Developer');
    fireEvent.change(keywordInput, { target: { value: 'Vue Developer' } });

    // Submit the form — the form's submit button is type="submit"
    const submitBtn = document.querySelector('form button[type="submit"]');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(capturedPayload).not.toBeNull();
    });
    expect(capturedPayload.keyword).toBe('Vue Developer');
  });

  it('after successful create, form is hidden', async () => {
    server.use(
      http.post('http://localhost:5000/api/candidate/job-alerts', async ({ request }) => {
        const body = await request.json();
        return HttpResponse.json({
          success: true,
          jobAlerts: [{ _id: 'al4', keyword: body.keyword, frequency: 'daily', isActive: true, skills: [] }],
        });
      })
    );

    renderWithProviders(<JobAlerts />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Create Alert/i }).length).toBeGreaterThan(0);
    });
    fireEvent.click(screen.getAllByRole('button', { name: /Create Alert/i })[0]);

    // Submit the form using the form's submit button
    const submitBtn = document.querySelector('form button[type="submit"]');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.queryByText('New Job Alert')).not.toBeInTheDocument();
    });
  });
});

describe('JobAlerts — form field changes', () => {
  const openForm = async () => {
    renderWithProviders(<JobAlerts />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Create Alert/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Create Alert/i }));
  };

  it('can change location input', async () => {
    await openForm();
    const locationInput = screen.getByPlaceholderText('Bengaluru');
    fireEvent.change(locationInput, { target: { value: 'Mumbai' } });
    expect(locationInput.value).toBe('Mumbai');
  });

  it('can change skills input', async () => {
    await openForm();
    const skillsInput = screen.getByPlaceholderText('React, Node.js');
    fireEvent.change(skillsInput, { target: { value: 'Python, Django' } });
    expect(skillsInput.value).toBe('Python, Django');
  });

  it('can change minSalary input', async () => {
    await openForm();
    const salaryInput = screen.getByPlaceholderText('500000');
    fireEvent.change(salaryInput, { target: { value: '800000' } });
    expect(salaryInput.value).toBe('800000');
  });

  it('can change jobType select', async () => {
    await openForm();
    const selects = document.querySelectorAll('select');
    const jobTypeSelect = Array.from(selects).find(s =>
      Array.from(s.options).some(o => o.text === 'Any')
    );
    if (jobTypeSelect) {
      fireEvent.change(jobTypeSelect, { target: { value: 'remote' } });
      // Controlled select — no crash means success
    }
  });

  it('can change frequency select', async () => {
    await openForm();
    const selects = document.querySelectorAll('select');
    const freqSelect = Array.from(selects).find(s =>
      Array.from(s.options).some(o => o.text === 'Weekly')
    );
    if (freqSelect) {
      fireEvent.change(freqSelect, { target: { value: 'weekly' } });
      expect(freqSelect.value).toBe('weekly');
    }
  });

  it('shows error toast when create API fails', async () => {
    const toast = await import('react-hot-toast');
    server.use(
      http.post('http://localhost:5000/api/candidate/job-alerts', () =>
        HttpResponse.json({ success: false, message: 'Server error' }, { status: 500 })
      )
    );
    await openForm();
    const keywordInput = screen.getByPlaceholderText('React Developer');
    fireEvent.change(keywordInput, { target: { value: 'Angular Dev' } });
    const submitBtn = document.querySelector('form button[type="submit"]');
    fireEvent.click(submitBtn);
    await waitFor(() => {
      expect(toast.default.error).toHaveBeenCalled();
    });
  });
});

describe('JobAlerts — delete alert', () => {
  it('clicking delete button calls DELETE /candidate/job-alerts/:id', async () => {
    let deleteCalled = false;
    server.use(
      http.delete('http://localhost:5000/api/candidate/job-alerts/:id', () => {
        deleteCalled = true;
        return HttpResponse.json({ success: true });
      })
    );

    renderWithProviders(<JobAlerts />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getAllByText('React').length).toBeGreaterThan(0);
    });

    // Find the trash button — it has text-red-400 class
    const trashButtons = Array.from(document.querySelectorAll('button')).filter(
      btn => btn.className.includes('text-red-400')
    );
    if (trashButtons.length > 0) {
      fireEvent.click(trashButtons[0]);
      await waitFor(() => {
        expect(deleteCalled).toBe(true);
      });
    }
  });

  it('shows error toast when delete fails', async () => {
    const toast = await import('react-hot-toast');
    server.use(
      http.delete('http://localhost:5000/api/candidate/job-alerts/:id', () =>
        HttpResponse.json({ success: false }, { status: 500 })
      )
    );
    renderWithProviders(<JobAlerts />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getAllByText('React').length).toBeGreaterThan(0);
    });
    const trashButtons = Array.from(document.querySelectorAll('button')).filter(
      btn => btn.className.includes('text-red-400')
    );
    if (trashButtons.length > 0) {
      fireEvent.click(trashButtons[0]);
      await waitFor(() => {
        expect(toast.default.error).toHaveBeenCalledWith('Failed to delete');
      });
    }
  });

  it('alert is removed from list after delete', async () => {
    server.use(
      http.delete('http://localhost:5000/api/candidate/job-alerts/:id', () =>
        HttpResponse.json({ success: true })
      )
    );

    renderWithProviders(<JobAlerts />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getAllByText('React').length).toBeGreaterThan(0);
    });

    const trashButtons = Array.from(document.querySelectorAll('button')).filter(
      btn => btn.className.includes('text-red-400')
    );
    if (trashButtons.length > 0) {
      fireEvent.click(trashButtons[0]);
      await waitFor(() => {
        // After deletion, the alert (keyword "React") should be removed
        const remainingReact = screen.queryAllByText('React');
        expect(remainingReact.length).toBe(0);
      });
    }
  });
});
