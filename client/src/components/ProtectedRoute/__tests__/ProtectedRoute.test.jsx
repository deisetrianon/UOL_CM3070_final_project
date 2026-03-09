import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProtectedRoute from '../index';

const mockAuthState = {
  isAuthenticated: false,
  isLoading: false,
  user: null,
  error: null,
  loginWithGoogle: vi.fn(),
  logout: vi.fn(),
  checkAuth: vi.fn(),
  registerLogoutCallback: vi.fn(),
};

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Navigate: ({ to, state, replace }) => {
      return <div data-testid="navigate-redirect" data-to={to}>Redirecting to {to}</div>;
    },
  };
});

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => mockAuthState,
  AuthProvider: ({ children }) => children,
}));

const TestComponent = () => <div>Protected Content</div>;

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthState.isAuthenticated = false;
    mockAuthState.isLoading = false;
    mockAuthState.user = null;
    mockAuthState.error = null;
    mockAuthState.loginWithGoogle = vi.fn();
    mockAuthState.logout = vi.fn();
    mockAuthState.checkAuth = vi.fn();
    mockAuthState.registerLogoutCallback = vi.fn();
  });

  it('should show loading when authentication is checking', () => {
    mockAuthState.isLoading = true;
    mockAuthState.isAuthenticated = false;

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  }, 10000);

  it('should redirect to login when not authenticated', () => {
    mockAuthState.isLoading = false;
    mockAuthState.isAuthenticated = false;

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByTestId('navigate-redirect')).toBeInTheDocument();
    expect(screen.getByTestId('navigate-redirect')).toHaveAttribute('data-to', '/login');
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  }, 10000);

  it('should render children when authenticated', () => {
    mockAuthState.isLoading = false;
    mockAuthState.isAuthenticated = true;
    mockAuthState.user = { id: '1', email: 'test@example.com' };

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  }, 10000);
});
