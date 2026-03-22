import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CalendarEvent from '../CalendarEvent';

describe('CalendarEvent', () => {
  const mockEvent = {
    id: 'event1',
    title: 'Team Meeting',
    start: '2024-01-15T10:00:00Z',
    end: '2024-01-15T11:00:00Z',
  };

  const mockStyle = {
    top: '100px',
    left: '50px',
    width: '200px',
  };

  const mockOnEventClick = vi.fn();

  it('should render calendar event', () => {
    render(
      <CalendarEvent
        event={mockEvent}
        style={mockStyle}
        isOverlapping={false}
        onEventClick={mockOnEventClick}
      />
    );

    expect(screen.getByText('Team Meeting')).toBeInTheDocument();
  });

  it('should display event time', () => {
    render(
      <CalendarEvent
        event={mockEvent}
        style={mockStyle}
        isOverlapping={false}
        onEventClick={mockOnEventClick}
      />
    );

    const timeElement = screen.getByText((content) => {
      return content.includes('-') && (content.includes(':') || content.includes('AM') || content.includes('PM'));
    });
    expect(timeElement).toBeInTheDocument();
  });

  it('should render only task title without time or due date line', () => {
    const taskEvent = {
      id: 'task-1',
      title: 'Ship release',
      start: '2026-03-24T00:00:00.000Z',
      end: '2026-03-24T01:00:00.000Z',
      resource: { type: 'task', deadlineDate: '2026-03-24' },
    };
    const { container } = render(
      <CalendarEvent
        event={taskEvent}
        style={mockStyle}
        isOverlapping={false}
        onEventClick={mockOnEventClick}
      />
    );
    expect(screen.getByText('Ship release')).toBeInTheDocument();
    expect(container.querySelector('.event-time')).toBeNull();
  });

  it('should show Google Meet icon for video meetings', () => {
    const meetEvent = {
      ...mockEvent,
      resource: { isGoogleMeet: true },
    };

    render(
      <CalendarEvent
        event={meetEvent}
        style={mockStyle}
        isOverlapping={false}
        onEventClick={mockOnEventClick}
      />
    );

    expect(document.querySelector('.event-meet-info')).toBeTruthy();
  });

  it('should call onEventClick when clicked', async () => {
    const user = userEvent.setup();
    render(
      <CalendarEvent
        event={mockEvent}
        style={mockStyle}
        isOverlapping={false}
        onEventClick={mockOnEventClick}
      />
    );

    const eventElement = screen.getByText('Team Meeting').closest('.calendar-event');
    await user.click(eventElement);

    expect(mockOnEventClick).toHaveBeenCalledWith(mockEvent);
  });
});
