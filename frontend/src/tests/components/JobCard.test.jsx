import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import JobCard from '../../components/common/JobCard';
import { renderWithProviders } from '../utils/renderWithProviders';

vi.mock('../../utils/socket', () => ({
  initSocket: vi.fn(),
  disconnectSocket: vi.fn(),
  getSocket: vi.fn(),
}));

const mockJob = {
  _id: 'j1',
  title: 'Frontend Developer',
  location: 'Bengaluru',
  jobType: 'full-time',
  experienceMin: 1,
  experienceMax: 3,
  skills: ['React', 'TypeScript', 'CSS', 'HTML', 'Node.js'],
  salaryMin: 500000,
  salaryMax: 1000000,
  openings: 3,
  isFeatured: false,
  status: 'active',
  createdAt: new Date().toISOString(),
  companyId: { _id: 'c1', name: 'TechCorp', isVerified: true, logo: {} },
};

const candidateAuth = {
  auth: { user: { _id: 'u1', role: 'candidate' }, isAuthenticated: true, initializing: false, token: 'tok' },
  jobs: { savedJobs: [] },
};

const recruiterAuth = {
  auth: { user: { _id: 'u2', role: 'recruiter' }, isAuthenticated: true, initializing: false, token: 'tok' },
  jobs: { savedJobs: [] },
};

describe('JobCard', () => {
  it('renders the job title', () => {
    renderWithProviders(<JobCard job={mockJob} />, { preloadedState: candidateAuth });
    expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
  });

  it('renders the company name', () => {
    renderWithProviders(<JobCard job={mockJob} />, { preloadedState: candidateAuth });
    expect(screen.getByText('TechCorp')).toBeInTheDocument();
  });

  it('renders the job location', () => {
    renderWithProviders(<JobCard job={mockJob} />, { preloadedState: candidateAuth });
    expect(screen.getByText('Bengaluru')).toBeInTheDocument();
  });

  it('renders the job type', () => {
    renderWithProviders(<JobCard job={mockJob} />, { preloadedState: candidateAuth });
    expect(screen.getByText('full-time')).toBeInTheDocument();
  });

  it('renders formatted salary', () => {
    renderWithProviders(<JobCard job={mockJob} />, { preloadedState: candidateAuth });
    expect(screen.getByText(/5\.0 - 10\.0 LPA/)).toBeInTheDocument();
  });

  it('renders up to 4 skills and shows +N for the rest', () => {
    renderWithProviders(<JobCard job={mockJob} />, { preloadedState: candidateAuth });
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('CSS')).toBeInTheDocument();
    expect(screen.getByText('HTML')).toBeInTheDocument();
    expect(screen.queryByText('Node.js')).not.toBeInTheDocument(); // 5th skill hidden
    expect(screen.getByText('+1')).toBeInTheDocument();
  });

  it('shows save button for a candidate user', () => {
    renderWithProviders(<JobCard job={mockJob} />, { preloadedState: candidateAuth });
    // The save button wraps a bookmark icon; check it's rendered
    const saveBtn = screen.getByRole('button');
    expect(saveBtn).toBeInTheDocument();
  });

  it('does NOT show save button for a recruiter user', () => {
    renderWithProviders(<JobCard job={mockJob} />, { preloadedState: recruiterAuth });
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows Featured badge when isFeatured is true', () => {
    const featuredJob = { ...mockJob, isFeatured: true };
    renderWithProviders(<JobCard job={featuredJob} />, { preloadedState: candidateAuth });
    expect(screen.getByText('Featured')).toBeInTheDocument();
  });

  it('does NOT show Featured badge when isFeatured is false', () => {
    renderWithProviders(<JobCard job={mockJob} />, { preloadedState: candidateAuth });
    expect(screen.queryByText('Featured')).not.toBeInTheDocument();
  });

  it('shows filled bookmark icon when job is already saved', () => {
    const savedAuth = {
      ...candidateAuth,
      jobs: { savedJobs: [mockJob] },
    };
    const { container } = renderWithProviders(<JobCard job={mockJob} />, { preloadedState: savedAuth });
    // When saved, the button has indigo background class
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('text-indigo-600');
  });

  it('hides save button when showSaveBtn=false', () => {
    renderWithProviders(<JobCard job={mockJob} showSaveBtn={false} />, { preloadedState: candidateAuth });
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows the number of openings when more than 1', () => {
    renderWithProviders(<JobCard job={mockJob} />, { preloadedState: candidateAuth });
    expect(screen.getByText('3 openings')).toBeInTheDocument();
  });
});
