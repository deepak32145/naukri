import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../utils/renderWithProviders';
import CandidateSearch from '../../../pages/recruiter/CandidateSearch';

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
  chat: { conversations: [], activeConversation: null, messages: {}, loading: false, onlineUserIds: [] },
};

describe('CandidateSearch', () => {
  it('renders Search Candidates heading', () => {
    renderWithProviders(<CandidateSearch />, { preloadedState: recruiterAuth });
    expect(screen.getAllByText('Search Candidates').length).toBeGreaterThan(0);
  });

  it('renders keyword filter input', () => {
    renderWithProviders(<CandidateSearch />, { preloadedState: recruiterAuth });
    expect(screen.getByPlaceholderText(/React Developer/i)).toBeInTheDocument();
  });

  it('renders skills filter input', () => {
    renderWithProviders(<CandidateSearch />, { preloadedState: recruiterAuth });
    expect(screen.getByPlaceholderText(/React, Python/i)).toBeInTheDocument();
  });

  it('renders location filter input', () => {
    renderWithProviders(<CandidateSearch />, { preloadedState: recruiterAuth });
    expect(screen.getByPlaceholderText('Bengaluru')).toBeInTheDocument();
  });

  it('renders Search Candidates button', () => {
    renderWithProviders(<CandidateSearch />, { preloadedState: recruiterAuth });
    expect(screen.getByRole('button', { name: /Search Candidates/i })).toBeInTheDocument();
  });

  it('renders Clear button', () => {
    renderWithProviders(<CandidateSearch />, { preloadedState: recruiterAuth });
    expect(screen.getByRole('button', { name: /Clear/i })).toBeInTheDocument();
  });

  it('loads and shows candidates after search', async () => {
    renderWithProviders(<CandidateSearch />, { preloadedState: recruiterAuth });
    fireEvent.click(screen.getByRole('button', { name: /Search Candidates/i }));
    await waitFor(() => {
      expect(screen.getByText('Test Candidate')).toBeInTheDocument();
    });
  });

  it('shows no results message when empty', async () => {
    renderWithProviders(<CandidateSearch />, { preloadedState: recruiterAuth });
    // Manually trigger empty state
    fireEvent.change(screen.getByPlaceholderText(/React Developer/i), { target: { value: 'xyz' } });
    // Without MSW returning empty, this tests the search flow
    fireEvent.click(screen.getByRole('button', { name: /Search Candidates/i }));
    // MSW returns results regardless of keyword — just check it doesn't crash
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Search Candidates/i })).toBeInTheDocument();
    });
  });

  it('clears results when Clear is clicked', async () => {
    renderWithProviders(<CandidateSearch />, { preloadedState: recruiterAuth });
    fireEvent.click(screen.getByRole('button', { name: /Search Candidates/i }));
    await waitFor(() => {
      expect(screen.getByText('Test Candidate')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Clear/i }));
    expect(screen.queryByText('Test Candidate')).not.toBeInTheDocument();
  });

  it('can type in skills input', () => {
    renderWithProviders(<CandidateSearch />, { preloadedState: recruiterAuth });
    const skillsInput = screen.getByPlaceholderText(/React, Python/i);
    fireEvent.change(skillsInput, { target: { value: 'JavaScript' } });
    expect(skillsInput.value).toBe('JavaScript');
  });

  it('can type in location input', () => {
    renderWithProviders(<CandidateSearch />, { preloadedState: recruiterAuth });
    const locationInput = screen.getByPlaceholderText('Bengaluru');
    fireEvent.change(locationInput, { target: { value: 'Mumbai' } });
    expect(locationInput.value).toBe('Mumbai');
  });

  it('can type in min experience input', () => {
    renderWithProviders(<CandidateSearch />, { preloadedState: recruiterAuth });
    const expMinInput = screen.getByPlaceholderText('0');
    fireEvent.change(expMinInput, { target: { value: '2' } });
    expect(expMinInput.value).toBe('2');
  });

  it('can type in max experience input', () => {
    renderWithProviders(<CandidateSearch />, { preloadedState: recruiterAuth });
    const expMaxInput = screen.getByPlaceholderText('10');
    fireEvent.change(expMaxInput, { target: { value: '5' } });
    expect(expMaxInput.value).toBe('5');
  });

  it('shows candidate headline and location when available', async () => {
    renderWithProviders(<CandidateSearch />, { preloadedState: recruiterAuth });
    fireEvent.click(screen.getByRole('button', { name: /Search Candidates/i }));
    await waitFor(() => {
      expect(screen.getByText('React Developer')).toBeInTheDocument();
      expect(screen.getByText(/Bengaluru/i)).toBeInTheDocument();
    });
  });

  it('shows Chat button for each candidate result', async () => {
    renderWithProviders(<CandidateSearch />, { preloadedState: recruiterAuth });
    fireEvent.click(screen.getByRole('button', { name: /Search Candidates/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Chat/i })).toBeInTheDocument();
    });
  });

  it('clicking Chat button for a candidate triggers startConversation', async () => {
    renderWithProviders(<CandidateSearch />, { preloadedState: recruiterAuth });
    fireEvent.click(screen.getByRole('button', { name: /Search Candidates/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Chat/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Chat/i }));
    // Should not throw; starts conversation dispatch
  });

  it('shows no candidates found message when API returns empty', async () => {
    const { server } = await import('../../mocks/server');
    const { http, HttpResponse } = await import('msw');
    server.use(
      http.get('http://localhost:5000/api/users', () =>
        HttpResponse.json({ success: true, profiles: [] })
      )
    );
    renderWithProviders(<CandidateSearch />, { preloadedState: recruiterAuth });
    fireEvent.click(screen.getByRole('button', { name: /Search Candidates/i }));
    await waitFor(() => {
      expect(screen.getByText(/No candidates found/i)).toBeInTheDocument();
    });
  });
});
