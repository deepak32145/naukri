import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../utils/renderWithProviders';
import UserProfile from '../../../pages/recruiter/UserProfile';
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

const BASE = 'http://localhost:5000/api';

const candidateUser = {
  _id: 'u1',
  name: 'Jane Dev',
  email: 'jane@test.com',
  phone: '+1 234',
  isVerified: true,
  avatar: { url: 'https://example.com/avatar.png' },
};

const richProfile = {
  headline: 'Senior Engineer',
  currentLocation: 'Bangalore',
  experienceYears: 5,
  about: 'Bio text',
  skills: ['React', 'Node'],
  experience: [
    {
      position: 'Developer',
      company: 'Acme',
      startDate: 'Jan 2020',
      endDate: 'Present',
      description: 'Built features',
    },
  ],
  education: [{ degree: 'B.Tech', institution: 'IIT', startYear: 2015, endYear: 2019 }],
  resume: { url: 'https://example.com/cv.pdf' },
  linkedin: 'https://linkedin.com/in/jane',
  github: 'https://github.com/jane',
  portfolio: 'https://jane.dev',
};

describe('UserProfile', () => {
  it('shows spinner then full profile when fetch succeeds', async () => {
    let resolveDeferred;
    const deferred = new Promise((r) => {
      resolveDeferred = r;
    });
    server.use(
      http.get(`${BASE}/users/:id`, async () => {
        await deferred;
        return HttpResponse.json({ success: true, user: candidateUser, profile: richProfile });
      })
    );

    const { container } = renderWithProviders(<UserProfile />, { initialEntries: ['/users/u1'] });

    await waitFor(() => {
      expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    });
    resolveDeferred();

    await waitFor(() => {
      expect(screen.getByText('Jane Dev')).toBeInTheDocument();
    });
    expect(screen.getByText('Senior Engineer')).toBeInTheDocument();
    expect(screen.getByText('Bio text')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Developer')).toBeInTheDocument();
    expect(screen.getByText('B.Tech')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /download resume/i })).toHaveAttribute(
      'href',
      'https://example.com/cv.pdf'
    );
    expect(screen.getByRole('link', { name: /linkedin/i })).toHaveAttribute(
      'href',
      'https://linkedin.com/in/jane'
    );
  });

  it('shows toast and user not found when request fails', async () => {
    server.use(
      http.get(`${BASE}/users/:id`, () => {
        return HttpResponse.json({ success: false, message: 'Server error' }, { status: 500 });
      })
    );

    renderWithProviders(<UserProfile />, { initialEntries: ['/users/bad'] });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load profile');
    });
    await waitFor(() => {
      expect(screen.getByText('User not found')).toBeInTheDocument();
    });
  });

  it('renders initials when user has no avatar', async () => {
    server.use(
      http.get(`${BASE}/users/:id`, () => {
        return HttpResponse.json({
          success: true,
          user: { _id: 'u2', name: 'Test User', email: 't@test.com', isVerified: false },
          profile: { headline: 'Dev', skills: [], experience: [], education: [] },
        });
      })
    );

    renderWithProviders(<UserProfile />, { initialEntries: ['/users/u2'] });

    await waitFor(() => {
      expect(screen.getByText('TU')).toBeInTheDocument();
    });
  });
});
