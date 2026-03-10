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

    expect(screen.getByText(/google meet/i)).toBeInTheDocument();
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
