import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import BurnoutSection from '../BurnoutSection';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const wrapper = ({ children }) => (
  <MemoryRouter>
    {children}
  </MemoryRouter>
);

describe('BurnoutSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render burnout section', () => {
    render(<BurnoutSection />, { wrapper });

    expect(screen.getByText(/feeling burnt out/i)).toBeInTheDocument();
  });

  it('should navigate to burnout page when clicked', async () => {
    const user = userEvent.setup();
    render(<BurnoutSection />, { wrapper });

    const button = screen.getByText(/feeling burnt out/i);
    await user.click(button);

    expect(mockNavigate).toHaveBeenCalledWith('/burnout');
  });
});
