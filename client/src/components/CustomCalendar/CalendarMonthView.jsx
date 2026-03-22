/**
 * Calendar Month View component.
 * Displays a full month calendar grid with events.
 * Shows events on their respective days with "more events" indicators.
 * 
 * @module components/CustomCalendar/CalendarMonthView
 * @component
 * @param {Object} props - Component props
 * @param {Date} props.currentDate - Current date to display
 * @param {Array} props.events - Array of calendar events
 * @param {Function} props.onEventClick - Callback when an event is clicked
 * @param {Function} props.onNavigate - Callback when navigating to different dates
 * @param {Function} props.onShowMoreEvents - Callback when "more events" is clicked
 * @returns {JSX.Element} Calendar Month View component
 */

import moment from 'moment';
import { getEventColorStyle, eventOccursOnCalendarDay } from './calendarUtils';
import './CustomCalendar.css';

function CalendarMonthView({ currentDate, events, onEventClick, onNavigate, onShowMoreEvents }) {
  const monthStart = moment(currentDate).startOf('month').startOf('week');
  const monthEnd = moment(currentDate).endOf('month').endOf('week');
  const days = [];
  let day = monthStart.clone();
  
  while (day <= monthEnd) {
    days.push(day.clone());
    day.add(1, 'day');
  }

  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const getEventsForDay = (day) => {
    return events
      .filter((event) => eventOccursOnCalendarDay(event, day))
      .sort((a, b) => {
        const startA =
          a.resource?.type === 'task' && a.resource?.deadlineDate
            ? day.clone().hour(6).minute(0)
            : moment(a.start);
        const startB =
          b.resource?.type === 'task' && b.resource?.deadlineDate
            ? day.clone().hour(6).minute(0)
            : moment(b.start);
        const d = startA.diff(startB);
        if (d !== 0) return d;
        return (a.title || '').localeCompare(b.title || '');
      });
  };

  const isToday = (day) => {
    return moment().isSame(day, 'day');
  };

  return (
    <div className="calendar-month-view">
      <div className="month-header">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(dayName => (
          <div key={dayName} className="month-day-header">{dayName}</div>
        ))}
      </div>
      <div className="month-weeks">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="month-week">
            {week.map((day, dayIndex) => {
              const dayEvents = getEventsForDay(day);
              const isCurrentMonth = day.isSame(currentDate, 'month');
              const isTodayDate = isToday(day);

              return (
                <div
                  key={dayIndex}
                  className={`month-day ${!isCurrentMonth ? 'other-month' : ''} ${isTodayDate ? 'today' : ''}`}
                  onClick={() => onNavigate && onNavigate(day.toDate())}
                >
                  <div className="month-day-number">{day.format('D')}</div>
                  <div className="month-day-events">
                    {dayEvents.slice(0, 3).map((event) => {
                      const colorStyle = getEventColorStyle(event);
                      return (
                        <div
                          key={event.id}
                          className="month-event"
                          style={colorStyle}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventClick(event);
                          }}
                        >
                          {event.title}
                        </div>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <div 
                        className="month-event-more"
                        onClick={(e) => {
                          e.stopPropagation();
                          onShowMoreEvents(dayEvents.slice(3), day);
                        }}
                      >
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default CalendarMonthView;
