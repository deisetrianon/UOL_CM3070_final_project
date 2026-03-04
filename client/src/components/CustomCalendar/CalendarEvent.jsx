import moment from 'moment';
import videoIcon from '../../assets/icons/videocall.png';
import { getEventColorStyle } from './calendarUtils';
import './CustomCalendar.css';

function CalendarEvent({ event, style, isOverlapping, onEventClick }) {
  const colorStyle = getEventColorStyle(event);
  const startTime = moment(event.start).format('h:mm');
  const endTime = moment(event.end).format('h:mm A');
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
        <div className={`event-time ${isOverlapping ? 'overlapping' : ''}`}>{startTime} - {endTime}</div>
        {isGoogleMeet && (
          <div className="event-meet-info">
            <img src={videoIcon} alt="Google Meet" className="event-meet-icon" />
            <span>Google Meet</span>
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
