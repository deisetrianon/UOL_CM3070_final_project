import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BreathingExercise from '../BreathingExercise';

describe('BreathingExercise', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render breathing exercise', () => {
    render(<BreathingExercise onClose={mockOnClose} />);

    expect(screen.getByText(/breathing exercise/i)).toBeInTheDocument();
  });

  it('should start breathing exercise', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<BreathingExercise onClose={mockOnClose} />);

    const startButton = screen.getByRole('button', { name: /start/i });
    await user.click(startButton);

    expect(screen.getByText(/breathe in/i)).toBeInTheDocument();
  });

  it('should switch breathing techniques', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<BreathingExercise onClose={mockOnClose} />);
 
    expect(screen.getByText(/calming technique that helps reduce anxiety/i)).toBeInTheDocument();

    const techniqueSelect = screen.getByLabelText(/technique/i);
    await user.selectOptions(techniqueSelect, 'box');

    await vi.advanceTimersByTime(100);

    expect(screen.getByText(/simple technique used by professionals/i)).toBeInTheDocument();
  });
});
