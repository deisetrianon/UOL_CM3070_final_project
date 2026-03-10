import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CalendarMonthView from '../CalendarMonthView';
import moment from 'moment';

describe('CalendarMonthView', () => {
  const mockEvents = [
    {
      id: 'event1',
      title: 'Meeting',
      start: '2024-01-15T10:00:00Z',
      end: '2024-01-15T11:00:00Z',
    },
  ];

  const mockProps = {
    currentDate: new Date('2024-01-15'),
    events: mockEvents,
    onEventClick: vi.fn(),
    onNavigate: vi.fn(),
    onShowMoreEvents: vi.fn(),
  };

  it('should render month view', () => {
    render(<CalendarMonthView {...mockProps} />);

    expect(screen.getByText(/sun/i)).toBeInTheDocument();
    expect(screen.getByText(/mon/i)).toBeInTheDocument();
  });

  it('should display day numbers', () => {
    render(<CalendarMonthView {...mockProps} />);

    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('should call onNavigate when day is clicked', async () => {
    const user = userEvent.setup();
    render(<CalendarMonthView {...mockProps} />);

    const day15 = screen.getByText('15').closest('.month-day');
    await user.click(day15);

    expect(mockProps.onNavigate).toHaveBeenCalled();
  });
});
