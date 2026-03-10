import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import UserMenu from '../index';
import { AuthProvider } from '../../../contexts/AuthContext';
import { DialogProvider } from '../../../contexts/DialogContext';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const wrapper = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      <DialogProvider>{children}</DialogProvider>
    </AuthProvider>
  </BrowserRouter>
);

describe('UserMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        success: true,
        isAuthenticated: true,
        user: {
          id: '1',
          email: 'test@example.com',
          displayName: 'Test User',
          picture: 'https://example.com/pic.jpg',
        },
      }),
    });
  });

  it('should render user menu', async () => {
    render(<UserMenu />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
  });

  it('should toggle menu when clicked', async () => {
    const user = userEvent.setup();
    render(<UserMenu />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    const menuButton = screen.getByLabelText(/user menu/i);
    await user.click(menuButton);

    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('should navigate to settings', async () => {
    const user = userEvent.setup();
    render(<UserMenu />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    const menuButton = screen.getByLabelText(/user menu/i);
    await user.click(menuButton);

    const settingsButton = screen.getByText('Settings');
    await user.click(settingsButton);

    expect(mockNavigate).toHaveBeenCalledWith('/settings');
  });
});
