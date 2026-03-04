import moment from 'moment';
import CalendarEvent from './CalendarEvent';
import './CustomCalendar.css';

function CalendarDayView({ currentDate, timeSlots, events, onEventClick, calculateEventLayout, getEventsForDay, isToday, formatTime }) {
  const day = moment(currentDate);
  const dayEvents = getEventsForDay(day);
  const eventLayout = calculateEventLayout(dayEvents, day);

  return (
    <div className="calendar-day-view">
      <div className="day-view-header">
        <div className="day-view-date">
          <div className="day-view-day-name">{day.format('dddd')}</div>
          <div className="day-view-day-number">{day.format('D')}</div>
          <div className="day-view-month-year">{day.format('MMMM YYYY')}</div>
        </div>
      </div>
      <div className="day-view-content">
        <div className="calendar-time-column">
          <div className="time-header"></div>
          <div className="time-slots">
            {timeSlots.map(hour => (
              <div key={hour} className="time-slot">
                <span className="time-label">{formatTime(moment().hour(hour).minute(0))}</span>
              </div>
            ))}
          </div>
        </div>
        <div className={`calendar-day-column ${isToday(day) ? 'today' : ''}`}>
          <div className="day-content">
            {timeSlots.map((hour, hourIndex) => (
              <div key={hourIndex} className="hour-slot"></div>
            ))}
            
            {dayEvents.map((event, eventIndex) => {
              const eventStyle = eventLayout[eventIndex];
              if (!eventStyle) return null;

              return (
                <CalendarEvent
                  key={event.id}
                  event={event}
                  style={{
                    top: eventStyle.top,
                    height: eventStyle.height,
                    width: eventStyle.width,
                    left: eventStyle.left,
                  }}
                  isOverlapping={eventStyle.isOverlapping}
                  onEventClick={onEventClick}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CalendarDayView;
