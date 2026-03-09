import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import CalendarDayView from '../CalendarDayView';

vi.mock('../CalendarEvent', () => ({
  default: ({ event }) => <div data-testid={`event-${event.id}`}>{event.title}</div>,
}));

describe('CalendarDayView', () => {
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
    timeSlots: [9, 10, 11, 12],
    events: mockEvents,
    onEventClick: vi.fn(),
    calculateEventLayout: vi.fn(() => [{ top: '100px', height: '50px', width: '100%', left: '0' }]),
    getEventsForDay: vi.fn(() => mockEvents),
    isToday: vi.fn(() => false),
    formatTime: vi.fn((time) => time.format('h:mm A')),
  };

  it('should render day view', () => {
    render(<CalendarDayView {...mockProps} />);

    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const foundDay = dayNames.some(day => screen.queryByText(new RegExp(day, 'i')));
    expect(foundDay).toBe(true);
  });

  it('should display events', () => {
    render(<CalendarDayView {...mockProps} />);

    expect(screen.getByTestId('event-event1')).toBeInTheDocument();
  });
});
