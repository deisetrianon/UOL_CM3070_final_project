import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TaskStats from '../TaskStats';

describe('TaskStats', () => {
  it('should not render when stats is null', () => {
    const { container } = render(<TaskStats stats={null} />);

    expect(container.firstChild).toBeNull();
  });

  it('should render task statistics', () => {
    const mockStats = {
      total: 10,
      todo: 5,
      inProgress: 3,
      done: 2,
      completionRate: 20,
    };

    render(<TaskStats stats={mockStats} />);

    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should display zero for missing stats', () => {
    const mockStats = {
      total: 0,
    };

    render(<TaskStats stats={mockStats} />);

    const statValues = screen.getAllByText('0');
    expect(statValues.length).toBeGreaterThan(0);
    const totalLabel = screen.getByText('Total');
    const totalValue = totalLabel.nextElementSibling;
    expect(totalValue).toHaveTextContent('0');
  });
});
