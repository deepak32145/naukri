import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../utils/renderWithProviders';
import ForgotPassword from '../../pages/ForgotPassword';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';

vi.mock('../../utils/socket', () => ({
  initSocket: vi.fn(),
  disconnectSocket: vi.fn(),
  getSocket: vi.fn(() => null),
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
  Toaster: () => null,
}));

describe('ForgotPassword — step 1', () => {
  it('renders step 1 email form by default', () => {
    renderWithProviders(<ForgotPassword />);
    expect(screen.getByText('Reset Password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('your@email.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Send Reset OTP/i })).toBeInTheDocument();
  });

  it('shows step 1 description text', () => {
    renderWithProviders(<ForgotPassword />);
    expect(screen.getByText(/Enter your email to get a reset OTP/i)).toBeInTheDocument();
  });

  it('has a link back to login', () => {
    renderWithProviders(<ForgotPassword />);
    expect(screen.getByRole('link', { name: /Back to Login/i })).toBeInTheDocument();
  });

  it('can type in email field', () => {
    renderWithProviders(<ForgotPassword />);
    const emailInput = screen.getByPlaceholderText('your@email.com');
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    expect(emailInput.value).toBe('user@example.com');
  });

  it('transitions to step 2 after sending OTP', async () => {
    renderWithProviders(<ForgotPassword />);
    const emailInput = screen.getByPlaceholderText('your@email.com');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Send Reset OTP/i }));
    await waitFor(() => {
      expect(screen.getByPlaceholderText('OTP')).toBeInTheDocument();
    });
  });
});

describe('ForgotPassword — step 2', () => {
  const goToStep2 = async () => {
    renderWithProviders(<ForgotPassword />);
    fireEvent.change(screen.getByPlaceholderText('your@email.com'), { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Send Reset OTP/i }));
    await waitFor(() => {
      expect(screen.getByPlaceholderText('OTP')).toBeInTheDocument();
    });
  };

  it('shows step 2 password form after OTP sent', async () => {
    await goToStep2();
    expect(screen.getByPlaceholderText(/New password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reset Password/i })).toBeInTheDocument();
  });

  it('step 2 description text changes', async () => {
    await goToStep2();
    expect(screen.getByText(/Enter the OTP and your new password/i)).toBeInTheDocument();
  });

  it('can type in OTP field', async () => {
    await goToStep2();
    const otpInput = screen.getByPlaceholderText('OTP');
    fireEvent.change(otpInput, { target: { value: '123456' } });
    expect(otpInput.value).toBe('123456');
  });

  it('can type in new password field', async () => {
    await goToStep2();
    const pwInput = screen.getByPlaceholderText(/New password/i);
    fireEvent.change(pwInput, { target: { value: 'newpass123' } });
    expect(pwInput.value).toBe('newpass123');
  });

  it('shows error toast when password is too short', async () => {
    const toast = await import('react-hot-toast');
    await goToStep2();
    fireEvent.change(screen.getByPlaceholderText('OTP'), { target: { value: '123456' } });
    fireEvent.change(screen.getByPlaceholderText(/New password/i), { target: { value: 'abc' } });
    fireEvent.click(screen.getByRole('button', { name: /Reset Password/i }));
    expect(toast.default.error).toHaveBeenCalledWith('Password must be at least 6 characters');
  });

  it('submits reset form with valid OTP and password', async () => {
    let resetCalled = false;
    server.use(
      http.post('http://localhost:5000/api/auth/reset-password', () => {
        resetCalled = true;
        return HttpResponse.json({ success: true, message: 'Password reset successfully' });
      })
    );
    await goToStep2();
    fireEvent.change(screen.getByPlaceholderText('OTP'), { target: { value: '123456' } });
    fireEvent.change(screen.getByPlaceholderText(/New password/i), { target: { value: 'validpassword' } });
    fireEvent.click(screen.getByRole('button', { name: /Reset Password/i }));
    await waitFor(() => {
      expect(resetCalled).toBe(true);
    });
  });

  it('shows error toast on failed reset (invalid OTP)', async () => {
    const toast = await import('react-hot-toast');
    server.use(
      http.post('http://localhost:5000/api/auth/reset-password', () =>
        HttpResponse.json({ success: false, message: 'Invalid OTP' }, { status: 400 })
      )
    );
    await goToStep2();
    fireEvent.change(screen.getByPlaceholderText('OTP'), { target: { value: '999999' } });
    fireEvent.change(screen.getByPlaceholderText(/New password/i), { target: { value: 'validpassword' } });
    fireEvent.click(screen.getByRole('button', { name: /Reset Password/i }));
    await waitFor(() => {
      expect(toast.default.error).toHaveBeenCalled();
    });
  });
});
