import moment from 'moment';
import CalendarEvent from './CalendarEvent';
import './CustomCalendar.css';

function CalendarWeekView({ weekDays, timeSlots, events, onEventClick, calculateEventLayout, getEventsForDay, isToday, formatTime }) {
  return (
    <div className="calendar-grid">
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
      {weekDays.map((day, dayIndex) => {
        const dayEvents = getEventsForDay(day);
        const eventLayout = calculateEventLayout(dayEvents, day);

        return (
          <div key={dayIndex} className={`calendar-day-column ${isToday(day) ? 'today' : ''}`}>
            <div className="day-header">
              <div className="day-name">{day.format('ddd')}</div>
              <div className="day-number">{day.format('D')}</div>
            </div> 
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
        );
      })}
    </div>
  );
}

export default CalendarWeekView;
