import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../utils/renderWithProviders';
import CandidateProfile from '../../../pages/candidate/CandidateProfile';
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
    user: { _id: 'u1', name: 'Test Candidate', email: 'c@test.com', role: 'candidate', isEmailVerified: true },
    token: 'tok', isAuthenticated: true, initializing: false, loading: false, error: null,
  },
};

describe('CandidateProfile — basic rendering', () => {
  it('shows user name after loading', async () => {
    renderWithProviders(<CandidateProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText('Test Candidate')).toBeInTheDocument();
    });
  });

  it('shows headline from profile', async () => {
    renderWithProviders(<CandidateProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText('Senior React Developer')).toBeInTheDocument();
    });
  });

  it('shows skills section', async () => {
    renderWithProviders(<CandidateProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText('Skills')).toBeInTheDocument();
      expect(screen.getByText('React')).toBeInTheDocument();
    });
  });

  it('shows experience section', async () => {
    renderWithProviders(<CandidateProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText('Experience')).toBeInTheDocument();
    });
  });

  it('shows education section', async () => {
    renderWithProviders(<CandidateProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText('Education')).toBeInTheDocument();
    });
  });

  it('shows Edit Profile link', async () => {
    renderWithProviders(<CandidateProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getAllByRole('link', { name: /Edit Profile/i }).length).toBeGreaterThan(0);
    });
  });

  it('shows profile completeness widget', async () => {
    renderWithProviders(<CandidateProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText(/Test Candidate/)).toBeInTheDocument();
    });
  });

  it('shows summary when profile has summary', async () => {
    renderWithProviders(<CandidateProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText('Experienced developer')).toBeInTheDocument();
    });
  });

  it('shows user email', async () => {
    renderWithProviders(<CandidateProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText('c@test.com')).toBeInTheDocument();
    });
  });

  it('shows verified badge when email is verified', async () => {
    renderWithProviders(<CandidateProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText('Verified')).toBeInTheDocument();
    });
  });

  it('shows current location', async () => {
    renderWithProviders(<CandidateProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText('Bengaluru')).toBeInTheDocument();
    });
  });

  it('shows resume upload section when no resume', async () => {
    renderWithProviders(<CandidateProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText(/Upload resume/i)).toBeInTheDocument();
    });
  });

  it('shows Resume heading', async () => {
    renderWithProviders(<CandidateProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText('Resume')).toBeInTheDocument();
    });
  });

  it('shows experience job title', async () => {
    renderWithProviders(<CandidateProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText('Dev')).toBeInTheDocument();
      expect(screen.getByText('ACME')).toBeInTheDocument();
    });
  });

  it('shows education details', async () => {
    renderWithProviders(<CandidateProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText('IIT')).toBeInTheDocument();
    });
  });
});

describe('CandidateProfile — profile views', () => {
  it('shows profile views section when profileViews has data', async () => {
    server.use(
      http.get('http://localhost:5000/api/candidate/profile-views', () =>
        HttpResponse.json({
          success: true,
          profileViews: [
            { viewedBy: { _id: 'u2', name: 'Jane Recruiter' }, viewedAt: new Date().toISOString() },
          ],
        })
      )
    );
    renderWithProviders(<CandidateProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText('Profile Views')).toBeInTheDocument();
      expect(screen.getByText('Jane Recruiter')).toBeInTheDocument();
    });
  });

  it('shows view count when profileViews has data', async () => {
    server.use(
      http.get('http://localhost:5000/api/candidate/profile-views', () =>
        HttpResponse.json({
          success: true,
          profileViews: [
            { viewedBy: { _id: 'u2', name: 'Viewer One' }, viewedAt: new Date().toISOString() },
            { viewedBy: { _id: 'u3', name: 'Viewer Two' }, viewedAt: new Date().toISOString() },
          ],
        })
      )
    );
    renderWithProviders(<CandidateProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  it('does not show profile views when empty', async () => {
    renderWithProviders(<CandidateProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.queryByText('Profile Views')).not.toBeInTheDocument();
    });
  });
});

describe('CandidateProfile — projects section', () => {
  it('shows projects section when profile has projects', async () => {
    server.use(
      http.get('http://localhost:5000/api/candidate/profile', () =>
        HttpResponse.json({
          success: true,
          profile: {
            _id: 'p1', headline: 'Dev', summary: 'A dev',
            skills: ['React'], currentLocation: 'Bengaluru', experienceYears: 2, completenessScore: 80,
            experience: [], education: [],
            projects: [
              { title: 'My Portfolio', description: 'A personal portfolio site', skills: ['React', 'CSS'], url: 'https://myportfolio.com' },
            ],
            certifications: [], preferredLocations: [], languages: [],
          },
        })
      )
    );
    renderWithProviders(<CandidateProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText('Projects')).toBeInTheDocument();
      expect(screen.getByText('My Portfolio')).toBeInTheDocument();
      expect(screen.getByText('A personal portfolio site')).toBeInTheDocument();
    });
  });

  it('shows project skills', async () => {
    server.use(
      http.get('http://localhost:5000/api/candidate/profile', () =>
        HttpResponse.json({
          success: true,
          profile: {
            _id: 'p1', headline: 'Dev', summary: null,
            skills: [], currentLocation: 'Bengaluru', experienceYears: 2, completenessScore: 60,
            experience: [], education: [],
            projects: [
              { title: 'Budget App', description: null, skills: ['Vue', 'Node.js'], url: null },
            ],
            certifications: [], preferredLocations: [], languages: [],
          },
        })
      )
    );
    renderWithProviders(<CandidateProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText('Vue')).toBeInTheDocument();
      expect(screen.getByText('Node.js')).toBeInTheDocument();
    });
  });

  it('shows View link for projects with URL', async () => {
    server.use(
      http.get('http://localhost:5000/api/candidate/profile', () =>
        HttpResponse.json({
          success: true,
          profile: {
            _id: 'p1', headline: 'Dev', summary: null,
            skills: [], currentLocation: null, experienceYears: 0, completenessScore: 50,
            experience: [], education: [],
            projects: [
              { title: 'Side Project', description: null, skills: [], url: 'https://example.com' },
            ],
            certifications: [], preferredLocations: [], languages: [],
          },
        })
      )
    );
    renderWithProviders(<CandidateProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText('View →')).toBeInTheDocument();
    });
  });
});

describe('CandidateProfile — certifications section', () => {
  it('shows certifications section when profile has certifications', async () => {
    server.use(
      http.get('http://localhost:5000/api/candidate/profile', () =>
        HttpResponse.json({
          success: true,
          profile: {
            _id: 'p1', headline: 'Dev', summary: null,
            skills: [], currentLocation: null, experienceYears: 0, completenessScore: 60,
            experience: [], education: [], projects: [],
            certifications: [
              { name: 'AWS Certified', issuer: 'Amazon', issueDate: '2023-01-01', url: 'https://aws.amazon.com/cert' },
            ],
            preferredLocations: [], languages: [],
          },
        })
      )
    );
    renderWithProviders(<CandidateProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText('Certifications')).toBeInTheDocument();
      expect(screen.getByText('AWS Certified')).toBeInTheDocument();
      expect(screen.getByText(/Amazon/i)).toBeInTheDocument();
    });
  });

  it('shows Verify link for certifications with URL', async () => {
    server.use(
      http.get('http://localhost:5000/api/candidate/profile', () =>
        HttpResponse.json({
          success: true,
          profile: {
            _id: 'p1', headline: 'Dev', summary: null,
            skills: [], currentLocation: null, experienceYears: 0, completenessScore: 60,
            experience: [], education: [], projects: [],
            certifications: [
              { name: 'Google Cloud', issuer: 'Google', issueDate: null, url: 'https://google.com/cert' },
            ],
            preferredLocations: [], languages: [],
          },
        })
      )
    );
    renderWithProviders(<CandidateProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText('Verify')).toBeInTheDocument();
    });
  });
});

describe('CandidateProfile — resume with existing URL', () => {
  it('shows View and Update buttons when resume exists', async () => {
    server.use(
      http.get('http://localhost:5000/api/candidate/profile', () =>
        HttpResponse.json({
          success: true,
          profile: {
            _id: 'p1', headline: 'Dev', summary: null,
            skills: [], currentLocation: null, experienceYears: 0, completenessScore: 60,
            experience: [], education: [], projects: [], certifications: [],
            resume: { url: 'https://cloudinary.com/resume.pdf', name: 'my-resume.pdf', uploadedAt: new Date().toISOString() },
            preferredLocations: [], languages: [],
          },
        })
      )
    );
    renderWithProviders(<CandidateProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText('View')).toBeInTheDocument();
      expect(screen.getByText('Update')).toBeInTheDocument();
      expect(screen.getByText('my-resume.pdf')).toBeInTheDocument();
    });
  });
});

describe('CandidateProfile — avatar upload', () => {
  it('has a file input for avatar upload', async () => {
    renderWithProviders(<CandidateProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText('Test Candidate')).toBeInTheDocument();
    });
    const avatarInput = document.querySelector('input[accept="image/*"]');
    expect(avatarInput).toBeTruthy();
  });

  it('calls API when avatar file is selected', async () => {
    let avatarCalled = false;
    server.use(
      http.put('http://localhost:5000/api/users/me/avatar', () => {
        avatarCalled = true;
        return HttpResponse.json({ success: true });
      })
    );
    renderWithProviders(<CandidateProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText('Test Candidate')).toBeInTheDocument();
    });
    const avatarInput = document.querySelector('input[accept="image/*"]');
    const file = new File(['img'], 'photo.png', { type: 'image/png' });
    Object.defineProperty(avatarInput, 'files', { value: [file], configurable: true });
    fireEvent.change(avatarInput);
    await waitFor(() => {
      expect(avatarCalled).toBe(true);
    });
  });
});

describe('CandidateProfile — resume upload', () => {
  it('has file input for resume upload', async () => {
    renderWithProviders(<CandidateProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText('Resume')).toBeInTheDocument();
    });
    const resumeInputs = document.querySelectorAll('input[accept="application/pdf"]');
    expect(resumeInputs.length).toBeGreaterThan(0);
  });

  it('shows error when non-PDF is uploaded', async () => {
    const toast = await import('react-hot-toast');
    renderWithProviders(<CandidateProfile />, { preloadedState: candidateAuth });
    await waitFor(() => {
      expect(screen.getByText('Resume')).toBeInTheDocument();
    });
    const resumeInput = document.querySelector('input[accept="application/pdf"]');
    const file = new File(['content'], 'doc.docx', { type: 'application/msword' });
    Object.defineProperty(resumeInput, 'files', { value: [file], configurable: true });
    fireEvent.change(resumeInput);
    await waitFor(() => {
      expect(toast.default.error).toHaveBeenCalledWith('Please upload a PDF file');
    });
  });
});
