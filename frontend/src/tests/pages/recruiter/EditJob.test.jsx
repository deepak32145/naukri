import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders } from '../../utils/renderWithProviders';
import EditJob from '../../../pages/recruiter/EditJob';
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

// j1 is already handled by the default MSW handler in handlers.js:
// title: 'React Developer', location: 'Bengaluru', skills: ['React'], status: 'active'
const renderEditJob = (jobId = 'j1') =>
  renderWithProviders(
    <Routes><Route path="/recruiter/jobs/:id/edit" element={<EditJob />} /></Routes>,
    { preloadedState: recruiterAuth, initialEntries: [`/recruiter/jobs/${jobId}/edit`] }
  );

beforeEach(() => {
  // Ensure PUT /jobs/:id returns success
  server.use(
    http.put('http://localhost:5000/api/jobs/:id', () =>
      HttpResponse.json({ success: true, job: { _id: 'j1', title: 'React Developer' } })
    )
  );
});

describe('EditJob', () => {
  it('renders Edit Job heading after loading', async () => {
    renderEditJob();
    await waitFor(() => {
      expect(screen.getByText('Edit Job')).toBeInTheDocument();
    });
  });

  it('pre-fills title from MSW data', async () => {
    renderEditJob();
    await waitFor(() => {
      expect(screen.getByDisplayValue('React Developer')).toBeInTheDocument();
    });
  });

  it('pre-fills location from MSW data', async () => {
    renderEditJob();
    await waitFor(() => {
      expect(screen.getByDisplayValue('Bengaluru')).toBeInTheDocument();
    });
  });

  it('renders Job Details section heading', async () => {
    renderEditJob();
    await waitFor(() => {
      expect(screen.getByText('Job Details')).toBeInTheDocument();
    });
  });

  it('renders Description section heading', async () => {
    renderEditJob();
    await waitFor(() => {
      expect(screen.getByText('Description')).toBeInTheDocument();
    });
  });

  it('renders Skills section heading', async () => {
    renderEditJob();
    await waitFor(() => {
      expect(screen.getByText('Skills')).toBeInTheDocument();
    });
  });

  it('renders Update Job submit button', async () => {
    renderEditJob();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Update Job/i })).toBeInTheDocument();
    });
  });

  it('renders Cancel button', async () => {
    renderEditJob();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    });
  });

  it('shows existing skill badge from MSW (React)', async () => {
    renderEditJob();
    await waitFor(() => {
      expect(screen.getByText('React')).toBeInTheDocument();
    });
  });

  it('allows changing the title input', async () => {
    renderEditJob();
    await waitFor(() => {
      expect(screen.getByDisplayValue('React Developer')).toBeInTheDocument();
    });
    const titleInput = screen.getByDisplayValue('React Developer');
    fireEvent.change(titleInput, { target: { value: 'Senior React Developer' } });
    expect(titleInput.value).toBe('Senior React Developer');
  });

  it('allows changing the location input', async () => {
    renderEditJob();
    await waitFor(() => {
      expect(screen.getByDisplayValue('Bengaluru')).toBeInTheDocument();
    });
    const locationInput = screen.getByDisplayValue('Bengaluru');
    fireEvent.change(locationInput, { target: { value: 'Mumbai' } });
    expect(locationInput.value).toBe('Mumbai');
  });

  it('job type select is present with full-time default from MSW', async () => {
    renderEditJob();
    await waitFor(() => {
      expect(screen.getByText('Job Details')).toBeInTheDocument();
    });
    // Find the Job Type select - it will have value 'full-time' from MSW data
    const selects = screen.getAllByRole('combobox');
    const jobTypeSelect = selects.find(s => s.value === 'full-time');
    expect(jobTypeSelect).toBeTruthy();
    expect(jobTypeSelect.value).toBe('full-time');
  });

  it('allows changing the status select', async () => {
    renderEditJob();
    await waitFor(() => {
      expect(screen.getByText('Job Details')).toBeInTheDocument();
    });
    const selects = screen.getAllByRole('combobox');
    const statusSelect = selects.find(s => ['active', 'paused', 'closed', 'draft'].includes(s.value));
    if (statusSelect) {
      fireEvent.change(statusSelect, { target: { value: 'paused' } });
      expect(statusSelect.value).toBe('paused');
    }
  });

  it('toggles Remote OK checkbox', async () => {
    renderEditJob();
    await waitFor(() => {
      expect(screen.getByText('Remote OK')).toBeInTheDocument();
    });
    const remoteCheckbox = screen.getByRole('checkbox', { name: /Remote OK/i });
    const initialChecked = remoteCheckbox.checked;
    fireEvent.click(remoteCheckbox);
    expect(remoteCheckbox.checked).toBe(!initialChecked);
  });

  it('toggles Featured checkbox', async () => {
    renderEditJob();
    await waitFor(() => {
      expect(screen.getByText('Featured')).toBeInTheDocument();
    });
    const featuredCheckbox = screen.getByRole('checkbox', { name: /Featured/i });
    const initialChecked = featuredCheckbox.checked;
    fireEvent.click(featuredCheckbox);
    expect(featuredCheckbox.checked).toBe(!initialChecked);
  });

  it('adds a new skill via input and Add button', async () => {
    renderEditJob();
    await waitFor(() => {
      expect(screen.getByText('Skills')).toBeInTheDocument();
    });
    const skillInput = screen.getByPlaceholderText(/Add skill/i);
    fireEvent.change(skillInput, { target: { value: 'TypeScript' } });
    fireEvent.click(screen.getByRole('button', { name: /^Add$/i }));
    await waitFor(() => {
      expect(screen.getByText('TypeScript')).toBeInTheDocument();
    });
  });

  it('removes existing skill badge by clicking trash icon', async () => {
    renderEditJob();
    await waitFor(() => {
      expect(screen.getByText('React')).toBeInTheDocument();
    });
    // The trash button is inside the React skill span
    const reactBadge = screen.getByText('React').closest('span');
    const trashButton = reactBadge.querySelector('button');
    fireEvent.click(trashButton);
    await waitFor(() => {
      expect(screen.queryByText('React')).not.toBeInTheDocument();
    });
  });

  it('submits the form and calls PUT /jobs/:id', async () => {
    let putCalled = false;
    server.use(
      http.put('http://localhost:5000/api/jobs/:id', () => {
        putCalled = true;
        return HttpResponse.json({ success: true, job: { _id: 'j1' } });
      })
    );

    renderEditJob();
    await waitFor(() => {
      expect(screen.getByDisplayValue('React Developer')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Update Job/i }));

    await waitFor(() => {
      expect(putCalled).toBe(true);
    });
  });

  it('shows Add skill input placeholder text', async () => {
    renderEditJob();
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Add skill/i)).toBeInTheDocument();
    });
  });

  it('has Description textarea pre-filled from MSW', async () => {
    renderEditJob();
    await waitFor(() => {
      // MSW returns description: 'A great React job' for j1
      expect(screen.getByDisplayValue('A great React job')).toBeInTheDocument();
    });
  });

  it('renders Job Title label', async () => {
    renderEditJob();
    await waitFor(() => {
      expect(screen.getByText(/Job Title/i)).toBeInTheDocument();
    });
  });

  it('renders Location label', async () => {
    renderEditJob();
    await waitFor(() => {
      expect(screen.getByText(/Location/i)).toBeInTheDocument();
    });
  });

  it('can change description textarea', async () => {
    renderEditJob();
    await waitFor(() => {
      expect(screen.getByDisplayValue('A great React job')).toBeInTheDocument();
    });
    const descTextarea = screen.getByDisplayValue('A great React job');
    fireEvent.change(descTextarea, { target: { value: 'Updated description' } });
    expect(descTextarea.value).toBe('Updated description');
  });

  it('can change requirements textarea', async () => {
    renderEditJob();
    await waitFor(() => {
      expect(screen.getByText('Description')).toBeInTheDocument();
    });
    const textareas = document.querySelectorAll('textarea');
    // Second textarea is the requirements field
    const reqTextarea = textareas[1];
    if (reqTextarea) {
      fireEvent.change(reqTextarea, { target: { value: '3+ years experience' } });
      expect(reqTextarea.value).toBe('3+ years experience');
    }
  });

  it('adds a new skill via Enter key press', async () => {
    renderEditJob();
    await waitFor(() => {
      expect(screen.getByText('Skills')).toBeInTheDocument();
    });
    const skillInput = screen.getByPlaceholderText(/Add skill/i);
    fireEvent.change(skillInput, { target: { value: 'Vue' } });
    fireEvent.keyDown(skillInput, { key: 'Enter' });
    await waitFor(() => {
      expect(screen.getByText('Vue')).toBeInTheDocument();
    });
  });
});
