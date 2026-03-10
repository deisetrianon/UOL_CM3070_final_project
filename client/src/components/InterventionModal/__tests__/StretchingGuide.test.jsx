import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StretchingGuide from '../StretchingGuide';

describe('StretchingGuide', () => {
  const mockOnClose = vi.fn();

  it('should render stretching guide', () => {
    render(<StretchingGuide onClose={mockOnClose} />);

    expect(screen.getByText(/guided stretching exercises/i)).toBeInTheDocument();
  });

  it('should navigate to next video', async () => {
    const user = userEvent.setup();
    render(<StretchingGuide onClose={mockOnClose} />);

    const nextButton = screen.getByText(/next/i);
    await user.click(nextButton);

    expect(screen.getByText(/2 \/ 10/i)).toBeInTheDocument();
  });

  it('should navigate to previous video', async () => {
    const user = userEvent.setup();
    render(<StretchingGuide onClose={mockOnClose} />);

    const nextButton = screen.getByText(/next/i);
    await user.click(nextButton);

    const prevButton = screen.getByText(/previous/i);
    await user.click(prevButton);

    expect(screen.getByText(/1 \/ 10/i)).toBeInTheDocument();
  });
});
