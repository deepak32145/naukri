import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../../components/common/ProtectedRoute';
import { renderWithProviders } from '../utils/renderWithProviders';

vi.mock('../../utils/socket', () => ({
  initSocket: vi.fn(),
  disconnectSocket: vi.fn(),
  getSocket: vi.fn(),
}));

const Child = () => <div>Protected Content</div>;
const LoginPage = () => <div>Login Page</div>;
const HomePage = () => <div>Home Page</div>;

// Wraps ProtectedRoute inside a Routes tree so Navigate works
const renderRoute = (authState, props = {}) =>
  renderWithProviders(
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<HomePage />} />
      <Route
        path="/protected"
        element={
          <ProtectedRoute {...props}>
            <Child />
          </ProtectedRoute>
        }
      />
    </Routes>,
    {
      preloadedState: { auth: authState },
      initialEntries: ['/protected'],
    }
  );

describe('ProtectedRoute', () => {
  it('hides content while auth is initializing', () => {
    renderRoute({ initializing: true, token: 'tok', isAuthenticated: false, user: null });
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('redirects to /login when not authenticated', () => {
    renderRoute({ initializing: false, token: null, isAuthenticated: false, user: null });
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('renders children when user is authenticated', () => {
    renderRoute({ initializing: false, token: 'tok', isAuthenticated: true, user: { role: 'candidate' } });
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('renders children when role matches allowed roles', () => {
    renderRoute(
      { initializing: false, token: 'tok', isAuthenticated: true, user: { role: 'candidate' } },
      { roles: ['candidate'] }
    );
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to / when user role does not match required roles', () => {
    renderRoute(
      { initializing: false, token: 'tok', isAuthenticated: true, user: { role: 'candidate' } },
      { roles: ['recruiter'] }
    );
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(screen.getByText('Home Page')).toBeInTheDocument();
  });

  it('renders children when no roles prop passed', () => {
    renderRoute({ initializing: false, token: 'tok', isAuthenticated: true, user: { role: 'recruiter' } });
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('allows admin through when admin is in roles list', () => {
    renderRoute(
      { initializing: false, token: 'tok', isAuthenticated: true, user: { role: 'admin' } },
      { roles: ['admin'] }
    );
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
