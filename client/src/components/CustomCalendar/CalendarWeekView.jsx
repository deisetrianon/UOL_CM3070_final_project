/**
 * Calendar Week View component.
 * Displays a week view with time slots and events for each day.
 * Shows events positioned by their start and end times across the week.
 * 
 * @module components/CustomCalendar/CalendarWeekView
 * @component
 * @param {Object} props - Component props
 * @param {Array} props.weekDays - Array of moment objects for each day in the week
 * @param {Array} props.timeSlots - Array of hour numbers for time slots
 * @param {Array} props.events - Array of calendar events
 * @param {Function} props.onEventClick - Callback when an event is clicked
 * @param {Function} props.calculateEventLayout - Function to calculate event positioning
 * @param {Function} props.getEventsForDay - Function to get events for a specific day
 * @param {Function} props.isToday - Function to check if a date is today
 * @param {Function} props.formatTime - Function to format time for display
 * @returns {JSX.Element} Calendar Week View component
 */

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
