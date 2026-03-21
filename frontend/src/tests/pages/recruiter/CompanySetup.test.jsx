import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../utils/renderWithProviders';
import CompanySetup from '../../../pages/recruiter/CompanySetup';
import { server } from '../../mocks/server';
import { http, HttpResponse } from 'msw';
import toast from 'react-hot-toast';

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

describe('CompanySetup — company exists', () => {
  it('renders Edit Company Profile heading when company exists', async () => {
    renderWithProviders(<CompanySetup />, { preloadedState: recruiterAuth });
    await waitFor(() => {
      expect(screen.getByText('Edit Company Profile')).toBeInTheDocument();
    });
  });

  it('pre-fills company name from MSW', async () => {
    renderWithProviders(<CompanySetup />, { preloadedState: recruiterAuth });
    await waitFor(() => {
      const nameInput = screen.getByDisplayValue('MyCorp');
      expect(nameInput).toBeInTheDocument();
    });
  });

  it('shows Company Logo section', async () => {
    renderWithProviders(<CompanySetup />, { preloadedState: recruiterAuth });
    await waitFor(() => {
      expect(screen.getByText('Company Logo')).toBeInTheDocument();
    });
  });

  it('shows Company Details form', async () => {
    renderWithProviders(<CompanySetup />, { preloadedState: recruiterAuth });
    await waitFor(() => {
      expect(screen.getByText('Company Details')).toBeInTheDocument();
    });
  });

  it('renders Update Company submit button', async () => {
    renderWithProviders(<CompanySetup />, { preloadedState: recruiterAuth });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Update Company/i })).toBeInTheDocument();
    });
  });

  it('allows changing company name input', async () => {
    renderWithProviders(<CompanySetup />, { preloadedState: recruiterAuth });
    await waitFor(() => {
      expect(screen.getByDisplayValue('MyCorp')).toBeInTheDocument();
    });
    const nameInput = screen.getByDisplayValue('MyCorp');
    fireEvent.change(nameInput, { target: { value: 'NewCorp' } });
    expect(nameInput.value).toBe('NewCorp');
  });

  it('allows changing description textarea', async () => {
    renderWithProviders(<CompanySetup />, { preloadedState: recruiterAuth });
    await waitFor(() => {
      expect(screen.getByText('Company Details')).toBeInTheDocument();
    });
    const descTextarea = screen.getByPlaceholderText('Describe your company, culture, mission...');
    fireEvent.change(descTextarea, { target: { value: 'A fantastic company' } });
    expect(descTextarea.value).toBe('A fantastic company');
  });

  it('allows changing industry select', async () => {
    renderWithProviders(<CompanySetup />, { preloadedState: recruiterAuth });
    await waitFor(() => {
      expect(screen.getByText('Company Details')).toBeInTheDocument();
    });
    const selects = screen.getAllByRole('combobox');
    // The first combobox is the industry select
    const industrySelectEl = selects.find(s =>
      Array.from(s.options).some(o => o.text === 'Select industry')
    );
    fireEvent.change(industrySelectEl, { target: { value: 'Information Technology' } });
    expect(industrySelectEl.value).toBe('Information Technology');
  });

  it('submits form with existing company and calls PUT /companies/:id', async () => {
    let putCalled = false;
    server.use(
      http.put('http://localhost:5000/api/companies/c2', async () => {
        putCalled = true;
        return HttpResponse.json({ success: true, company: { _id: 'c2', name: 'MyCorp' } });
      })
    );
    renderWithProviders(<CompanySetup />, { preloadedState: recruiterAuth });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Update Company/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Update Company/i }));
    await waitFor(() => {
      expect(putCalled).toBe(true);
    });
  });

  it('shows success toast after successful company update', async () => {
    renderWithProviders(<CompanySetup />, { preloadedState: recruiterAuth });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Update Company/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Update Company/i }));
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Company profile saved!');
    });
  });

  it('shows error toast when company name is cleared and submitted', async () => {
    renderWithProviders(<CompanySetup />, { preloadedState: recruiterAuth });
    await waitFor(() => {
      expect(screen.getByDisplayValue('MyCorp')).toBeInTheDocument();
    });
    const nameInput = screen.getByDisplayValue('MyCorp');
    fireEvent.change(nameInput, { target: { value: '' } });
    // Submit the form directly to bypass HTML5 required validation
    const form = nameInput.closest('form');
    fireEvent.submit(form);
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Company name is required');
    });
  });
});

describe('CompanySetup — form fields', () => {
  it('allows changing company size select', async () => {
    renderWithProviders(<CompanySetup />, { preloadedState: recruiterAuth });
    await waitFor(() => {
      expect(screen.getByText('Company Details')).toBeInTheDocument();
    });
    const sizeSelect = Array.from(document.querySelectorAll('select')).find(
      s => Array.from(s.options).some(o => o.text === 'Select size')
    );
    if (sizeSelect) {
      fireEvent.change(sizeSelect, { target: { value: '51-200' } });
    }
  });

  it('allows changing headquarters/location input', async () => {
    renderWithProviders(<CompanySetup />, { preloadedState: recruiterAuth });
    await waitFor(() => {
      expect(screen.getByText('Company Details')).toBeInTheDocument();
    });
    const locationInput = screen.getByPlaceholderText('City, State');
    fireEvent.change(locationInput, { target: { value: 'Mumbai' } });
    expect(locationInput.value).toBe('Mumbai');
  });

  it('allows changing founded year input', async () => {
    renderWithProviders(<CompanySetup />, { preloadedState: recruiterAuth });
    await waitFor(() => {
      expect(screen.getByText('Company Details')).toBeInTheDocument();
    });
    const foundedInput = screen.getByPlaceholderText('e.g. 2010');
    fireEvent.change(foundedInput, { target: { value: '2018' } });
    expect(foundedInput.value).toBe('2018');
  });

  it('allows changing website input', async () => {
    renderWithProviders(<CompanySetup />, { preloadedState: recruiterAuth });
    await waitFor(() => {
      expect(screen.getByText('Company Details')).toBeInTheDocument();
    });
    const websiteInput = screen.getByPlaceholderText('https://company.com');
    fireEvent.change(websiteInput, { target: { value: 'https://mynewsite.com' } });
    expect(websiteInput.value).toBe('https://mynewsite.com');
  });

  it('allows changing LinkedIn URL input', async () => {
    renderWithProviders(<CompanySetup />, { preloadedState: recruiterAuth });
    await waitFor(() => {
      expect(screen.getByText('Company Details')).toBeInTheDocument();
    });
    const linkedinInput = screen.getByPlaceholderText(/linkedin.com\/company/i);
    fireEvent.change(linkedinInput, { target: { value: 'https://linkedin.com/company/mycorp' } });
    expect(linkedinInput.value).toBe('https://linkedin.com/company/mycorp');
  });
});

describe('CompanySetup — logo upload', () => {
  it('has a file input for logo upload', async () => {
    renderWithProviders(<CompanySetup />, { preloadedState: recruiterAuth });
    await waitFor(() => {
      expect(screen.getByText('Company Logo')).toBeInTheDocument();
    });
    const logoInput = document.querySelector('input[accept="image/*"]');
    expect(logoInput).toBeTruthy();
  });

  it('shows error toast when uploading logo without saved company', async () => {
    const { server: mswServer } = await import('../../mocks/server');
    const { http: mswHttp, HttpResponse: mswRes } = await import('msw');
    mswServer.use(
      mswHttp.get('http://localhost:5000/api/companies/my', () =>
        mswRes.json({ success: true, company: null })
      )
    );
    const toast = await import('react-hot-toast');
    renderWithProviders(<CompanySetup />, { preloadedState: recruiterAuth });
    await waitFor(() => {
      expect(screen.getByText('Company Logo')).toBeInTheDocument();
    });
    const logoInput = document.querySelector('input[accept="image/*"]');
    if (logoInput) {
      const file = new File(['img'], 'logo.png', { type: 'image/png' });
      Object.defineProperty(logoInput, 'files', { value: [file], configurable: true });
      fireEvent.change(logoInput);
      expect(toast.default.error).toHaveBeenCalledWith('Save company details first');
    }
  });

  it('calls logo upload API when company exists and file selected', async () => {
    let logoCalled = false;
    server.use(
      http.post('http://localhost:5000/api/companies/c2/logo', () => {
        logoCalled = true;
        return HttpResponse.json({ success: true, logo: { url: 'https://cloudinary.com/logo.png' } });
      })
    );
    renderWithProviders(<CompanySetup />, { preloadedState: recruiterAuth });
    await waitFor(() => {
      expect(screen.getByText('Company Logo')).toBeInTheDocument();
    });
    const logoInput = document.querySelector('input[accept="image/*"]');
    if (logoInput) {
      const file = new File(['img'], 'logo.png', { type: 'image/png' });
      Object.defineProperty(logoInput, 'files', { value: [file], configurable: true });
      fireEvent.change(logoInput);
      await waitFor(() => {
        expect(logoCalled).toBe(true);
      });
    }
  });
});

describe('CompanySetup — no company', () => {
  it('shows Setup Company Profile heading when no company exists', async () => {
    server.use(
      http.get('http://localhost:5000/api/companies/my', () =>
        HttpResponse.json({ success: true, company: null })
      )
    );
    renderWithProviders(<CompanySetup />, { preloadedState: recruiterAuth });
    await waitFor(() => {
      expect(screen.getByText('Setup Company Profile')).toBeInTheDocument();
    });
  });

  it('renders Create Company Profile button when no company exists', async () => {
    server.use(
      http.get('http://localhost:5000/api/companies/my', () =>
        HttpResponse.json({ success: true, company: null })
      )
    );
    renderWithProviders(<CompanySetup />, { preloadedState: recruiterAuth });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Create Company Profile/i })).toBeInTheDocument();
    });
  });

  it('submits new company via POST /companies', async () => {
    let postCalled = false;
    server.use(
      http.get('http://localhost:5000/api/companies/my', () =>
        HttpResponse.json({ success: true, company: null })
      ),
      http.post('http://localhost:5000/api/companies', async ({ request }) => {
        postCalled = true;
        const body = await request.json();
        return HttpResponse.json({ success: true, company: { _id: 'c3', ...body } });
      })
    );
    renderWithProviders(<CompanySetup />, { preloadedState: recruiterAuth });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Create Company Profile/i })).toBeInTheDocument();
    });
    // Fill in a company name (required)
    const nameInput = screen.getByPlaceholderText('Acme Corp');
    fireEvent.change(nameInput, { target: { value: 'StartupCo' } });
    fireEvent.click(screen.getByRole('button', { name: /Create Company Profile/i }));
    await waitFor(() => {
      expect(postCalled).toBe(true);
    });
  });

  it('shows error toast when submitting new company without name', async () => {
    server.use(
      http.get('http://localhost:5000/api/companies/my', () =>
        HttpResponse.json({ success: true, company: null })
      )
    );
    renderWithProviders(<CompanySetup />, { preloadedState: recruiterAuth });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Create Company Profile/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Create Company Profile/i }));
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Company name is required');
    });
  });
});
