import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AnxietyRelief from '../AnxietyRelief';

describe('AnxietyRelief', () => {
  const mockOnClose = vi.fn();

  it('should render anxiety relief component', () => {
    render(<AnxietyRelief onClose={mockOnClose} />);

    expect(screen.getByText(/anxiety relief techniques/i)).toBeInTheDocument();
  });

  it('should display technique options', () => {
    render(<AnxietyRelief onClose={mockOnClose} />);

    expect(screen.getAllByText(/5-4-3-2-1 grounding/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/box breathing/i)).toBeInTheDocument();
  });

  it('should switch techniques when option is clicked', async () => {
    const user = userEvent.setup();
    render(<AnxietyRelief onClose={mockOnClose} />);

    const techniqueOption = screen.getByText(/progressive muscle relaxation/i);
    await user.click(techniqueOption);

    expect(techniqueOption).toHaveClass('active');
  });
});
