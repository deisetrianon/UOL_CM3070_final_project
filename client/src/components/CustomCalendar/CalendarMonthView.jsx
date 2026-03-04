import moment from 'moment';
import { getEventColorStyle } from './calendarUtils';
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
    return events.filter(event => {
      const eventStart = moment(event.start);
      return eventStart.isSame(day, 'day');
    }).sort((a, b) => moment(a.start).diff(moment(b.start)));
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
