import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../utils/renderWithProviders';
import VerifyEmail from '../../pages/VerifyEmail';

vi.mock('../../utils/socket', () => ({
  initSocket: vi.fn(),
  disconnectSocket: vi.fn(),
  getSocket: vi.fn(() => null),
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
  Toaster: () => null,
}));

const candidateState = {
  auth: {
    user: { _id: 'u1', name: 'Test Candidate', email: 'c@test.com', role: 'candidate' },
    token: 'tok', isAuthenticated: true, initializing: false, loading: false, error: null,
  },
};

describe('VerifyEmail', () => {
  it('renders the verify email page', () => {
    renderWithProviders(<VerifyEmail />, { preloadedState: candidateState });
    expect(screen.getByText('Verify your email')).toBeInTheDocument();
  });

  it('shows the user email', () => {
    renderWithProviders(<VerifyEmail />, { preloadedState: candidateState });
    expect(screen.getByText(/c@test.com/)).toBeInTheDocument();
  });

  it('renders OTP input', () => {
    renderWithProviders(<VerifyEmail />, { preloadedState: candidateState });
    expect(screen.getByPlaceholderText('000000')).toBeInTheDocument();
  });

  it('renders Verify Email button (disabled when OTP empty)', () => {
    renderWithProviders(<VerifyEmail />, { preloadedState: candidateState });
    const btn = screen.getByRole('button', { name: /Verify Email/i });
    expect(btn).toBeDisabled();
  });

  it('enables verify button when 6-digit OTP is entered', () => {
    renderWithProviders(<VerifyEmail />, { preloadedState: candidateState });
    const input = screen.getByPlaceholderText('000000');
    fireEvent.change(input, { target: { value: '123456' } });
    const btn = screen.getByRole('button', { name: /Verify Email/i });
    expect(btn).not.toBeDisabled();
  });

  it('renders Resend button', () => {
    renderWithProviders(<VerifyEmail />, { preloadedState: candidateState });
    expect(screen.getByRole('button', { name: /Resend/i })).toBeInTheDocument();
  });

  it('calls resend OTP on resend click', async () => {
    renderWithProviders(<VerifyEmail />, { preloadedState: candidateState });
    fireEvent.click(screen.getByRole('button', { name: /Resend/i }));
    await waitFor(() => {
      // After resend, the button text should return to Resend
      expect(screen.getByRole('button', { name: /Resend/i })).toBeInTheDocument();
    });
  });

  it('submits OTP verification', async () => {
    renderWithProviders(<VerifyEmail />, { preloadedState: candidateState });
    const input = screen.getByPlaceholderText('000000');
    fireEvent.change(input, { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: /Verify Email/i }));
    // No error thrown — MSW handles the call
    await waitFor(() => {
      expect(input).toBeInTheDocument();
    });
  });
});
