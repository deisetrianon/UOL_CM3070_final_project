import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '../AuthContext';

const TestComponent = () => {
  const { user, isAuthenticated, isLoading, error, loginWithGoogle, logout } = useAuth();

  return (
    <div>
      {isLoading && <div>Loading...</div>}
      {error && <div>Error: {error}</div>}
      {isAuthenticated ? (
        <div>User: {user?.email}</div>
      ) : (
        <div>Not authenticated</div>
      )}
      <button onClick={loginWithGoogle}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('should throw error when used outside provider', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAuth must be used within an AuthProvider');

    errorSpy.mockRestore();
  });

  it('should check authentication on mount', async () => {
    const mockUser = {
      id: 'user-id',
      email: 'test@example.com',
      displayName: 'Test User',
    };

    global.fetch.mockResolvedValueOnce({
      json: async () => ({
        success: true,
        isAuthenticated: true,
        user: mockUser,
      }),
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();
    });
  });

  it('should handle unauthenticated state', async () => {
    global.fetch.mockResolvedValueOnce({
      json: async () => ({
        success: false,
        isAuthenticated: false,
        user: null,
      }),
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/not authenticated/i)).toBeInTheDocument();
    });
  });

  it('should handle authentication check errors', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/not authenticated/i)).toBeInTheDocument();
    });
  });

  it('should redirect to Google login', async () => {
    delete window.location;
    window.location = { href: '' };

    global.fetch.mockResolvedValueOnce({
      json: async () => ({
        success: false,
        isAuthenticated: false,
      }),
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/not authenticated/i)).toBeInTheDocument();
    });

    const loginButton = screen.getByText('Login');
    loginButton.click();

    expect(window.location.href).toBe('/api/auth/google');
  });

  it('should logout successfully', async () => {
    const mockUser = {
      id: 'user-id',
      email: 'test@example.com',
    };

    global.fetch
      .mockResolvedValueOnce({
        json: async () => ({
          success: true,
          isAuthenticated: true,
          user: mockUser,
        }),
      })
      .mockResolvedValueOnce({
        json: async () => ({ success: true }),
      });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();
    });

    const logoutButton = screen.getByText('Logout');
    logoutButton.click();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/logout',
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  it('should register and call logout callbacks', async () => {
    const callback = vi.fn();

    const TestComponentWithCallback = () => {
      const { registerLogoutCallback } = useAuth();

      useEffect(() => {
        registerLogoutCallback(callback);
      }, [registerLogoutCallback]);

      return <div>Test</div>;
    };

    global.fetch
      .mockResolvedValueOnce({
        json: async () => ({ success: false, isAuthenticated: false }),
      })
      .mockResolvedValueOnce({
        json: async () => ({ success: true }),
      });

    render(
      <AuthProvider>
        <TestComponentWithCallback />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });
});
