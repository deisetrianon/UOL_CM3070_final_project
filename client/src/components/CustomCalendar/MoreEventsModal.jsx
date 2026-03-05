/**
 * More Events Modal component.
 * Modal displaying all events for a specific day when there are too many to show in the calendar.
 * Shows event list with times and allows clicking to view event details.
 * 
 * @module components/CustomCalendar/MoreEventsModal
 * @component
 * @param {Object} props - Component props
 * @param {Array} props.events - Array of events to display
 * @param {moment.Moment} props.selectedDay - The day these events belong to
 * @param {Function} props.onEventClick - Callback when an event is clicked
 * @param {Function} props.onClose - Callback when modal is closed
 * @param {Function} props.getEventColorStyle - Function to get event color styling
 * @returns {JSX.Element} More Events Modal component
 */

import moment from 'moment';
import videoIcon from '../../assets/icons/videocall.png';
import './CustomCalendar.css';

function MoreEventsModal({ events, selectedDay, onEventClick, onClose, getEventColorStyle }) {
  const formatEventTime = (event) => {
    const startTime = moment(event.start).format('h:mm A');
    const endTime = moment(event.end).format('h:mm A');
    return `${startTime} - ${endTime}`;
  };

  return (
    <div 
      className="more-events-modal-overlay"
      onClick={onClose}
    >
      <div 
        className="more-events-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="more-events-modal-header">
          <h3>Events for {selectedDay?.format('MMMM D, YYYY')}</h3>
          <button 
            className="more-events-close-btn"
            onClick={onClose}
            aria-label="Close events modal"
          >
            ✕
          </button>
        </div>
        <div className="more-events-modal-content">
          {events.map((event) => {
            const colorStyle = getEventColorStyle(event);
            const isGoogleMeet = event.resource?.isGoogleMeet;
            
            return (
              <div
                key={event.id}
                className="more-events-item"
                style={colorStyle}
                onClick={() => {
                  onEventClick(event);
                  onClose();
                }}
              >
                <div className="more-events-item-time">{formatEventTime(event)}</div>
                <div className="more-events-item-title">{event.title}</div>
                {isGoogleMeet && (
                  <div className="more-events-item-meet">
                    <img src={videoIcon} alt="Google Meet" className="more-events-meet-icon" />
                    <span>Google Meet</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default MoreEventsModal;
