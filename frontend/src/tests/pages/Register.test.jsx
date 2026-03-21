import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Register from '../../pages/Register';
import { renderWithProviders } from '../utils/renderWithProviders';

vi.mock('../../utils/socket', () => ({
  initSocket: vi.fn(),
  disconnectSocket: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
  Toaster: () => null,
}));

const unauthState = {
  auth: { user: null, token: null, isAuthenticated: false, initializing: false, loading: false, error: null },
};

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('Register page — rendering', () => {
  it('renders the full name, email, phone, and password inputs', () => {
    renderWithProviders(<Register />, { preloadedState: unauthState });
    expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/\+91/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Min. 6 characters')).toBeInTheDocument();
  });

  it('renders Job Seeker and Recruiter role buttons', () => {
    renderWithProviders(<Register />, { preloadedState: unauthState });
    expect(screen.getByRole('button', { name: /job seeker/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /recruiter/i })).toBeInTheDocument();
  });

  it('defaults to Candidate role — shows "Create Candidate Account" button', () => {
    renderWithProviders(<Register />, { preloadedState: unauthState });
    expect(screen.getByRole('button', { name: /create candidate account/i })).toBeInTheDocument();
  });

  it('renders sign in link', () => {
    renderWithProviders(<Register />, { preloadedState: unauthState });
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
  });
});

// ─── Role selection ───────────────────────────────────────────────────────────

describe('Register page — role selection', () => {
  it('switches to Recruiter role and changes button text', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Register />, { preloadedState: unauthState });
    await user.click(screen.getByRole('button', { name: /recruiter/i }));
    expect(screen.getByRole('button', { name: /create recruiter account/i })).toBeInTheDocument();
  });

  it('switches back to Job Seeker role', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Register />, { preloadedState: unauthState });
    await user.click(screen.getByRole('button', { name: /recruiter/i }));
    await user.click(screen.getByRole('button', { name: /job seeker/i }));
    expect(screen.getByRole('button', { name: /create candidate account/i })).toBeInTheDocument();
  });
});

// ─── Password visibility toggle ───────────────────────────────────────────────

describe('Register page — password toggle', () => {
  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Register />, { preloadedState: unauthState });
    const pwdInput = screen.getByPlaceholderText('Min. 6 characters');
    expect(pwdInput).toHaveAttribute('type', 'password');
    const toggleBtn = pwdInput.parentElement.querySelector('button');
    await user.click(toggleBtn);
    expect(pwdInput).toHaveAttribute('type', 'text');
    await user.click(toggleBtn);
    expect(pwdInput).toHaveAttribute('type', 'password');
  });
});

// ─── Form interaction ─────────────────────────────────────────────────────────

describe('Register page — form interaction', () => {
  it('updates all input fields as user types', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Register />, { preloadedState: unauthState });
    await user.type(screen.getByPlaceholderText('John Doe'), 'Jane Smith');
    await user.type(screen.getByPlaceholderText('you@example.com'), 'jane@test.com');
    await user.type(screen.getByPlaceholderText(/\+91/), '9876543210');
    await user.type(screen.getByPlaceholderText('Min. 6 characters'), 'secret123');
    expect(screen.getByPlaceholderText('John Doe')).toHaveValue('Jane Smith');
    expect(screen.getByPlaceholderText('you@example.com')).toHaveValue('jane@test.com');
    expect(screen.getByPlaceholderText('Min. 6 characters')).toHaveValue('secret123');
  });
});

// ─── Submission ───────────────────────────────────────────────────────────────

describe('Register page — submission', () => {
  it('shows error toast when password is less than 6 characters', async () => {
    const toast = await import('react-hot-toast');
    const user = userEvent.setup();
    renderWithProviders(<Register />, { preloadedState: unauthState });
    await user.type(screen.getByPlaceholderText('John Doe'), 'Test User');
    await user.type(screen.getByPlaceholderText('you@example.com'), 'test@test.com');
    await user.type(screen.getByPlaceholderText('Min. 6 characters'), '123');
    await user.click(screen.getByRole('button', { name: /create candidate account/i }));
    expect(toast.default.error).toHaveBeenCalledWith('Password must be at least 6 characters');
  });

  it('dispatches registerUser on valid form submission', async () => {
    const toast = await import('react-hot-toast');
    const user = userEvent.setup();
    renderWithProviders(<Register />, { preloadedState: unauthState });
    await user.type(screen.getByPlaceholderText('John Doe'), 'Test User');
    await user.type(screen.getByPlaceholderText('you@example.com'), 'test@test.com');
    await user.type(screen.getByPlaceholderText('Min. 6 characters'), 'password123');
    await user.click(screen.getByRole('button', { name: /create candidate account/i }));
    await waitFor(() => {
      expect(toast.default.success).toHaveBeenCalledWith(expect.stringContaining('verify'));
    });
  });

  it('disables submit button when loading', () => {
    renderWithProviders(<Register />, {
      preloadedState: { auth: { ...unauthState.auth, loading: true } },
    });
    expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled();
  });
});
