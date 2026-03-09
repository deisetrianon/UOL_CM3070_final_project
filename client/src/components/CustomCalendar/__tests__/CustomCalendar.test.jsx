import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import CustomCalendar from '../index';

vi.mock('../CalendarMonthView', () => ({
  default: () => <div>Month View</div>,
}));

vi.mock('../CalendarWeekView', () => ({
  default: () => <div>Week View</div>,
}));

vi.mock('../CalendarDayView', () => ({
  default: () => <div>Day View</div>,
}));

describe('CustomCalendar', () => {
  const mockEvents = [
    {
      id: 'event1',
      title: 'Meeting',
      start: '2024-01-15T10:00:00Z',
      end: '2024-01-15T11:00:00Z',
    },
  ];

  const mockProps = {
    events: mockEvents,
    currentDate: new Date('2024-01-15'),
    view: 'week',
    onEventClick: vi.fn(),
    onNavigate: vi.fn(),
  };

  it('should render calendar with week view', () => {
    render(<CustomCalendar {...mockProps} />);

    expect(screen.getByText('Week View')).toBeInTheDocument();
  });

  it('should render calendar with month view', () => {
    const props = {
      ...mockProps,
      view: 'month',
    };

    render(<CustomCalendar {...props} />);

    expect(screen.getByText('Month View')).toBeInTheDocument();
  });

  it('should render calendar with day view', () => {
    const props = {
      ...mockProps,
      view: 'day',
    };

    render(<CustomCalendar {...props} />);

    expect(screen.getByText('Day View')).toBeInTheDocument();
  });
});
