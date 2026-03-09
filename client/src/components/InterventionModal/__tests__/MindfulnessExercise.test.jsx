import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MindfulnessExercise from '../MindfulnessExercise';

describe('MindfulnessExercise', () => {
  const mockOnClose = vi.fn();

  it('should render mindfulness exercise', () => {
    render(<MindfulnessExercise onClose={mockOnClose} />);

    expect(screen.getByText(/guided mindfulness meditation/i)).toBeInTheDocument();
  });

  it('should display video options', () => {
    render(<MindfulnessExercise onClose={mockOnClose} />);

    expect(screen.getByText(/5-minute mindfulness meditation/i)).toBeInTheDocument();
    expect(screen.getByText(/10-minute mindfulness meditation/i)).toBeInTheDocument();
  });

  it('should switch video when option is clicked', async () => {
    const user = userEvent.setup();
    render(<MindfulnessExercise onClose={mockOnClose} />);

    const videoOptionText = screen.getByText(/10-minute mindfulness meditation/i);
    const videoOptionButton = videoOptionText.closest('button');
    await user.click(videoOptionButton);

    expect(videoOptionButton).toHaveClass('active');
  });
});
