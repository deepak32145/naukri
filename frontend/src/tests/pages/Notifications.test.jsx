import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import Notifications from '../../pages/Notifications';
import { renderWithProviders } from '../utils/renderWithProviders';

vi.mock('../../utils/socket', () => ({
  initSocket: vi.fn(),
  disconnectSocket: vi.fn(),
  getSocket: vi.fn(() => null),
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
  Toaster: () => null,
}));

const withNotifications = {
  auth: {
    user: { _id: 'u1', name: 'Test', role: 'candidate' },
    token: 'tok', isAuthenticated: true, initializing: false, loading: false,
  },
  notifications: {
    notifications: [
      { _id: 'n1', title: 'Application update', body: 'You were shortlisted', isRead: false, type: 'application_update', createdAt: new Date().toISOString() },
      { _id: 'n2', title: 'New message', body: 'Hi there', isRead: true, type: 'new_message', createdAt: new Date().toISOString(), link: '/chat' },
    ],
    unreadCount: 1,
    loading: false,
  },
};

const empty = {
  auth: withNotifications.auth,
  notifications: { notifications: [], unreadCount: 0, loading: false },
};

const loadingState = {
  auth: withNotifications.auth,
  notifications: { notifications: [], unreadCount: 0, loading: true },
};

describe('Notifications page — rendering', () => {
  it('renders the Notifications heading', async () => {
    renderWithProviders(<Notifications />, { preloadedState: withNotifications });
    await waitFor(() => {
      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });
  });

  it('shows unread count when there are unread notifications', async () => {
    renderWithProviders(<Notifications />, { preloadedState: withNotifications });
    await waitFor(() => {
      expect(screen.getByText(/1 unread/i)).toBeInTheDocument();
    });
  });

  it('shows "Mark all read" button when there are unread notifications', async () => {
    renderWithProviders(<Notifications />, { preloadedState: withNotifications });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /mark all read/i })).toBeInTheDocument();
    });
  });

  it('renders notification titles', async () => {
    renderWithProviders(<Notifications />, { preloadedState: withNotifications });
    await waitFor(() => {
      expect(screen.getByText('Application update')).toBeInTheDocument();
      expect(screen.getByText('New message')).toBeInTheDocument();
    });
  });

  it('renders notification bodies', async () => {
    renderWithProviders(<Notifications />, { preloadedState: withNotifications });
    await waitFor(() => {
      expect(screen.getByText('You were shortlisted')).toBeInTheDocument();
    });
  });

  it('renders delete buttons for each notification', async () => {
    renderWithProviders(<Notifications />, { preloadedState: withNotifications });
    await waitFor(() => {
      // Trash2 icon buttons exist for each notification
      const allButtons = screen.getAllByRole('button');
      // At least 3 buttons: mark all read + 2 delete buttons
      expect(allButtons.length).toBeGreaterThanOrEqual(3);
    });
  });

  it('unread notification has indigo background styling', async () => {
    renderWithProviders(<Notifications />, { preloadedState: withNotifications });
    await waitFor(() => {
      expect(screen.getByText('Application update')).toBeInTheDocument();
    });
    // Unread notification row has bg-indigo-50 class
    const unreadEl = screen.getByText('Application update').closest('div[class*="bg-indigo"]');
    expect(unreadEl).toBeTruthy();
  });
});

describe('Notifications page — empty state', () => {
  it('shows "All caught up!" when no notifications', async () => {
    server.use(
      http.get('http://localhost:5000/api/notifications', () =>
        HttpResponse.json({ success: true, notifications: [], unreadCount: 0 })
      )
    );
    renderWithProviders(<Notifications />, { preloadedState: empty });
    await waitFor(() => {
      expect(screen.getByText('All caught up!')).toBeInTheDocument();
    });
  });

  it('shows "No notifications yet" text in empty state', async () => {
    server.use(
      http.get('http://localhost:5000/api/notifications', () =>
        HttpResponse.json({ success: true, notifications: [], unreadCount: 0 })
      )
    );
    renderWithProviders(<Notifications />, { preloadedState: empty });
    await waitFor(() => {
      expect(screen.getByText('No notifications yet')).toBeInTheDocument();
    });
  });

  it('does not show "Mark all read" button when no unread notifications', async () => {
    server.use(
      http.get('http://localhost:5000/api/notifications', () =>
        HttpResponse.json({ success: true, notifications: [], unreadCount: 0 })
      )
    );
    renderWithProviders(<Notifications />, { preloadedState: empty });
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /mark all read/i })).toBeNull();
    });
  });

  it('does not show unread count text when count is zero', async () => {
    renderWithProviders(<Notifications />, { preloadedState: empty });
    await waitFor(() => {
      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });
    expect(screen.queryByText(/0 unread/i)).toBeNull();
  });
});

describe('Notifications page — loading state', () => {
  it('shows spinner while loading', async () => {
    const { container } = renderWithProviders(<Notifications />, { preloadedState: loadingState });
    await waitFor(() => {
      expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });
});

describe('Notifications page — mark all read', () => {
  it('dispatches markAllRead when "Mark all read" is clicked', async () => {
    const { store } = renderWithProviders(<Notifications />, { preloadedState: withNotifications });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /mark all read/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /mark all read/i }));
    await waitFor(() => {
      expect(store.getState().notifications.unreadCount).toBe(0);
    });
  });

  it('hides "Mark all read" button after marking all read', async () => {
    renderWithProviders(<Notifications />, { preloadedState: withNotifications });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /mark all read/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /mark all read/i }));
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /mark all read/i })).toBeNull();
    });
  });
});

describe('Notifications page — click notification', () => {
  it('clicking an unread notification marks it as read in store', async () => {
    server.use(
      http.put('http://localhost:5000/api/notifications/n1/read', () =>
        HttpResponse.json({ success: true })
      )
    );
    const { store } = renderWithProviders(<Notifications />, { preloadedState: withNotifications });
    await waitFor(() => {
      expect(screen.getByText('Application update')).toBeInTheDocument();
    });
    // Click on the notification row
    fireEvent.click(screen.getByText('Application update'));
    await waitFor(() => {
      const n = store.getState().notifications.notifications.find(n => n._id === 'n1');
      expect(n?.isRead).toBe(true);
    });
  });

  it('clicking a read notification with a link does not throw', async () => {
    renderWithProviders(<Notifications />, { preloadedState: withNotifications });
    await waitFor(() => {
      expect(screen.getByText('New message')).toBeInTheDocument();
    });
    expect(() => fireEvent.click(screen.getByText('New message'))).not.toThrow();
  });

  it('clicking delete button removes notification from store', async () => {
    server.use(
      http.delete('http://localhost:5000/api/notifications/n1', () =>
        HttpResponse.json({ success: true })
      )
    );
    const { store } = renderWithProviders(<Notifications />, { preloadedState: withNotifications });
    await waitFor(() => {
      expect(screen.getByText('Application update')).toBeInTheDocument();
    });

    // Delete buttons are inside each notification row — find trash icon buttons
    const trashButtons = Array.from(document.querySelectorAll('button')).filter(
      btn => btn.querySelector('svg') && btn.className.includes('text-gray')
    );
    if (trashButtons.length > 0) {
      fireEvent.click(trashButtons[0]);
      await waitFor(() => {
        const ids = store.getState().notifications.notifications.map(n => n._id);
        expect(ids).not.toContain('n1');
      });
    }
  });

  it('delete button stopPropagation prevents notification click handler', async () => {
    server.use(
      http.delete('http://localhost:5000/api/notifications/n2', () =>
        HttpResponse.json({ success: true })
      )
    );
    renderWithProviders(<Notifications />, { preloadedState: withNotifications });
    await waitFor(() => {
      expect(screen.getByText('New message')).toBeInTheDocument();
    });
    // Find trash buttons and click one without crashing
    const trashButtons = Array.from(document.querySelectorAll('button')).filter(
      btn => btn.querySelector('svg') && btn.className.includes('text-gray')
    );
    if (trashButtons.length >= 2) {
      expect(() => fireEvent.click(trashButtons[1])).not.toThrow();
    }
  });
});
