import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import CalendarWeekView from '../CalendarWeekView';
import moment from 'moment';

vi.mock('../CalendarEvent', () => ({
  default: ({ event }) => <div data-testid={`event-${event.id}`}>{event.title}</div>,
}));

describe('CalendarWeekView', () => {
  const mockWeekDays = Array.from({ length: 7 }, (_, i) =>
    moment().startOf('week').add(i, 'days')
  );

  const mockEvents = [
    {
      id: 'event1',
      title: 'Meeting',
      start: moment().startOf('week').add(1, 'days').hour(10).toISOString(),
      end: moment().startOf('week').add(1, 'days').hour(11).toISOString(),
    },
  ];

  const mockProps = {
    weekDays: mockWeekDays,
    timeSlots: [9, 10, 11, 12],
    events: mockEvents,
    onEventClick: vi.fn(),
    calculateEventLayout: vi.fn(() => [{ top: '100px', height: '50px', width: '100%', left: '0' }]),
    getEventsForDay: vi.fn(() => mockEvents),
    isToday: vi.fn(() => false),
    formatTime: vi.fn((time) => time.format('h:mm A')),
  };

  it('should render week view', () => {
    render(<CalendarWeekView {...mockProps} />);

    expect(screen.getByText(/mon/i)).toBeInTheDocument();
  });

  it('should display events for each day', () => {
    render(<CalendarWeekView {...mockProps} />);

    const eventElements = screen.getAllByTestId('event-event1');
    expect(eventElements.length).toBeGreaterThan(0);
  });
});
