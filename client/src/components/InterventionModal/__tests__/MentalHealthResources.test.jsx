import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import MentalHealthResources from '../MentalHealthResources';

describe('MentalHealthResources', () => {
  const mockOnClose = vi.fn();

  it('should render mental health resources', () => {
    render(<MentalHealthResources onClose={mockOnClose} />);

    expect(screen.getByText(/mental health support resources/i)).toBeInTheDocument();
  });

  it('should display crisis hotlines', () => {
    render(<MentalHealthResources onClose={mockOnClose} />);

    expect(screen.getByText(/national suicide prevention lifeline/i)).toBeInTheDocument();
    expect(screen.getByText(/988/i)).toBeInTheDocument();
  });

  it('should display professional resources', () => {
    render(<MentalHealthResources onClose={mockOnClose} />);

    expect(screen.getByText(/find a therapist/i)).toBeInTheDocument();
    expect(screen.getByText(/online support groups/i)).toBeInTheDocument();
  });
});
