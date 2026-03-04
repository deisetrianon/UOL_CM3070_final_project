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
