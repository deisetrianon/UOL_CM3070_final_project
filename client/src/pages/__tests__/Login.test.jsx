import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from '../Login';
import { AuthProvider } from '../../contexts/AuthContext';
import { DialogProvider } from '../../contexts/DialogContext';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete window.location;
    window.location = { href: '' };
  });

  it('should render login page', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ success: false, isAuthenticated: false }),
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <DialogProvider>
            <Login />
          </DialogProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent(/zenflow/i);
    }, { timeout: 3000 });

    expect(screen.getByText(/continue with google/i)).toBeInTheDocument();
  });

  it('should show loading state', async () => {
    global.fetch = vi.fn(() => new Promise(() => {}));

    render(
      <MemoryRouter>
        <AuthProvider>
          <DialogProvider>
            <Login />
          </DialogProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/checking authentication/i)).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('should display error messages', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ success: false, isAuthenticated: false }),
    });

    render(
      <MemoryRouter initialEntries={['/login?error=auth_failed']}>
        <AuthProvider>
          <DialogProvider>
            <Login />
          </DialogProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/authentication failed/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should redirect when authenticated', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        success: true,
        isAuthenticated: true,
        user: { id: '1', email: 'test@example.com' },
      }),
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <DialogProvider>
            <Login />
          </DialogProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalled();
    }, { timeout: 5000 });
  });
});
