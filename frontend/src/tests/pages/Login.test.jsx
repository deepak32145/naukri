import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '../../pages/Login';
import { renderWithProviders } from '../utils/renderWithProviders';

// Mock socket — Login dispatches loginUser which calls initSocket
vi.mock('../../utils/socket', () => ({
  initSocket: vi.fn(),
  disconnectSocket: vi.fn(),
}));

// Mock react-hot-toast to capture toast calls
vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
  Toaster: () => null,
}));

const unauthState = {
  auth: { user: null, token: null, isAuthenticated: false, initializing: false, loading: false, error: null },
};

describe('Login page — rendering', () => {
  it('renders the email and password inputs', () => {
    renderWithProviders(<Login />, { preloadedState: unauthState });
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter password')).toBeInTheDocument();
  });

  it('renders the Sign In button', () => {
    renderWithProviders(<Login />, { preloadedState: unauthState });
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders demo Candidate and Recruiter buttons', () => {
    renderWithProviders(<Login />, { preloadedState: unauthState });
    expect(screen.getByRole('button', { name: /candidate/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /recruiter/i })).toBeInTheDocument();
  });

  it('renders a link to the register page', () => {
    renderWithProviders(<Login />, { preloadedState: unauthState });
    expect(screen.getByRole('link', { name: /create one/i })).toBeInTheDocument();
  });

  it('renders a forgot password link', () => {
    renderWithProviders(<Login />, { preloadedState: unauthState });
    expect(screen.getByRole('link', { name: /forgot password/i })).toBeInTheDocument();
  });
});

describe('Login page — demo credentials', () => {
  it('fills in candidate demo credentials on button click', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login />, { preloadedState: unauthState });
    await user.click(screen.getByRole('button', { name: /candidate/i }));
    expect(screen.getByPlaceholderText('you@example.com')).toHaveValue('candidate@demo.com');
  });

  it('fills in recruiter demo credentials on button click', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login />, { preloadedState: unauthState });
    await user.click(screen.getByRole('button', { name: /recruiter/i }));
    expect(screen.getByPlaceholderText('you@example.com')).toHaveValue('recruiter@demo.com');
  });
});

describe('Login page — password toggle', () => {
  it('toggles password visibility on eye icon click', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login />, { preloadedState: unauthState });
    const passwordInput = screen.getByPlaceholderText('Enter password');
    expect(passwordInput).toHaveAttribute('type', 'password');
    // The toggle button is in the password field area (not submit, not demo)
    const toggleBtn = passwordInput.parentElement.querySelector('button');
    await user.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'text');
  });
});

describe('Login page — form interaction', () => {
  it('updates email field as user types', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login />, { preloadedState: unauthState });
    const emailInput = screen.getByPlaceholderText('you@example.com');
    await user.type(emailInput, 'test@example.com');
    expect(emailInput).toHaveValue('test@example.com');
  });

  it('updates password field as user types', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login />, { preloadedState: unauthState });
    const passwordInput = screen.getByPlaceholderText('Enter password');
    await user.type(passwordInput, 'secret123');
    expect(passwordInput).toHaveValue('secret123');
  });
});

describe('Login page — submission', () => {
  it('disables submit button and shows "Signing in..." when loading', () => {
    renderWithProviders(<Login />, {
      preloadedState: { auth: { ...unauthState.auth, loading: true } },
    });
    const btn = screen.getByRole('button', { name: /signing in/i });
    expect(btn).toBeDisabled();
  });

  it('dispatches loginUser and shows success toast for candidate login', async () => {
    const toast = await import('react-hot-toast');
    const user = userEvent.setup();
    const { store } = renderWithProviders(<Login />, { preloadedState: unauthState });

    await user.type(screen.getByPlaceholderText('you@example.com'), 'candidate@test.com');
    await user.type(screen.getByPlaceholderText('Enter password'), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(store.getState().auth.isAuthenticated).toBe(true);
    });
    expect(toast.default.success).toHaveBeenCalledWith(expect.stringContaining('Welcome back'));
  });

  it('shows error toast on failed login', async () => {
    const toast = await import('react-hot-toast');
    const user = userEvent.setup();
    renderWithProviders(<Login />, { preloadedState: unauthState });

    await user.type(screen.getByPlaceholderText('you@example.com'), 'wrong@test.com');
    await user.type(screen.getByPlaceholderText('Enter password'), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(toast.default.error).toHaveBeenCalledWith('Invalid credentials');
    });
  });
});
