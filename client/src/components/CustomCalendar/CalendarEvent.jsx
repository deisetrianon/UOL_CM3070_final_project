/**
 * Calendar Event component.
 * Individual calendar event display with title, time, and styling.
 * Shows Google Meet icon for video meetings.
 * 
 * @module components/CustomCalendar/CalendarEvent
 * @component
 * @param {Object} props - Component props
 * @param {Object} props.event - Calendar event object
 * @param {Object} props.style - CSS style object for positioning
 * @param {boolean} props.isOverlapping - Whether the event overlaps with others
 * @param {Function} props.onEventClick - Callback when event is clicked
 * @returns {JSX.Element} Calendar Event component
 */

import moment from 'moment';
import { getEventColorStyle } from './calendarUtils';
import './CustomCalendar.css';

function CalendarEvent({ event, style, isOverlapping, onEventClick }) {
  const colorStyle = getEventColorStyle(event);
  const isTask = event.resource?.type === 'task';
  const startTime = moment(event.start).format('h:mm');
  const endTime = moment(event.end).format('h:mm A');
  const timeLine = `${startTime} - ${endTime}`;
  const isGoogleMeet = event.resource?.isGoogleMeet;

  return (
    <div
      className="calendar-event"
      style={{
        ...style,
        ...colorStyle
      }}
      onClick={(e) => {
        e.stopPropagation();
        onEventClick(event);
      }}
    >
      <div className="event-content">
        <div className="event-title">{event.title}</div>
        {!isTask && (
          <div className={`event-time ${isOverlapping ? 'overlapping' : ''}`}>{timeLine}</div>
        )}
        {isGoogleMeet && (
          <div className="event-meet-info">
            {event.resource?.attendees && event.resource.attendees.length > 0 && (
              <div className="event-attendees">
                {event.resource.attendees.slice(0, 2).map((attendee, idx) => (
                  <span key={idx} className="attendee-avatar">
                    {attendee.email ? attendee.email.charAt(0).toUpperCase() : '?'}
                  </span>
                ))}
                {event.resource.attendees.length > 2 && (
                  <span className="attendee-more">+{event.resource.attendees.length - 2}</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CalendarEvent;
