import { useMemo, useState } from 'react';
import moment from 'moment';
import videoIcon from '../../assets/icons/videocall.png';
import './CustomCalendar.css';

function CustomCalendar({ events, currentDate, view = 'week', onEventClick, onNavigate }) {
  const [showMoreEventsModal, setShowMoreEventsModal] = useState(false);
  const [selectedDayEvents, setSelectedDayEvents] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);

  const weekStart = useMemo(() => {
    return moment(currentDate).startOf('week');
  }, [currentDate]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => weekStart.clone().add(i, 'days'));
  }, [weekStart]);

  // Generating time slots (6 AM to 11 PM)
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 6; hour <= 23; hour++) {
      slots.push(hour);
    }
    return slots;
  }, []);

  const getEventsForDay = (day) => {
    return events.filter(event => {
      const eventStart = moment(event.start);
      return eventStart.isSame(day, 'day');
    }).sort((a, b) => moment(a.start).diff(moment(b.start)));
  };

  const eventsOverlap = (event1, event2) => {
    const start1 = moment(event1.start);
    const end1 = moment(event1.end);
    const start2 = moment(event2.start);
    const end2 = moment(event2.end);
    return start1.isBefore(end2) && start2.isBefore(end1);
  };

  const calculateEventLayout = (dayEvents, day) => {
    const dayStart = day.clone().hour(6).minute(0).second(0);
    const dayEnd = day.clone().hour(23).minute(59).second(59);
    const groups = [];
    const processed = new Set();
    
    dayEvents.forEach((event, index) => {
      if (processed.has(index)) return;
      
      const group = [event];
      processed.add(index);
      
      dayEvents.forEach((otherEvent, otherIndex) => {
        if (index !== otherIndex && !processed.has(otherIndex)) {
          if (eventsOverlap(event, otherEvent)) {
            group.push(otherEvent);
            processed.add(otherIndex);
          }
        }
      });
      
      groups.push(group);
    });
    
    return dayEvents.map((event) => {
      const eventStart = moment(event.start);
      const eventEnd = moment(event.end);
      
      if (!eventStart.isSame(day, 'day')) {
        return null;
      }

      const groupIndex = groups.findIndex(group => group.includes(event));
      const group = groups[groupIndex];
      const eventIndexInGroup = group.indexOf(event);
      const groupSize = group.length;
      
      const visibleStart = eventStart.isBefore(dayStart) ? dayStart : eventStart;
      const visibleEnd = eventEnd.isAfter(dayEnd) ? dayEnd : eventEnd;
      
      const startMinutes = visibleStart.diff(dayStart, 'minutes');
      const durationMinutes = visibleEnd.diff(visibleStart, 'minutes');
      
      const top = Math.max(0, (startMinutes / 60) * 48);
      const height = Math.max((durationMinutes / 60) * 48, 24);
      
      const width = groupSize > 1 ? `${100 / groupSize}%` : '100%';
      const left = groupSize > 1 ? `${(eventIndexInGroup / groupSize) * 100}%` : '0%';
      
      return {
        top: `${top}px`,
        height: `${height}px`,
        width: width,
        left: left,
        isOverlapping: groupSize > 1
      };
    });
  };

  const getEventColorStyle = (event) => {
    const isTask = event.resource?.type === 'task';
    const isGoogleMeet = event.resource?.isGoogleMeet;
    const taskPriority = event.resource?.taskPriority;
    const taskIsUrgent = event.resource?.taskIsUrgent;
    const calendarColor = event.resource?.calendarColor;

    if (isTask) {
      if (taskIsUrgent || taskPriority === 'urgent') {
        return {
          backgroundColor: 'rgba(234, 67, 53, 0.1)',
          borderLeftColor: '#ea4335'
        };
      } else if (taskPriority === 'high') {
        return {
          backgroundColor: 'rgba(251, 188, 4, 0.1)',
          borderLeftColor: '#fbbc04'
        };
      } else if (taskPriority === 'medium') {
        return {
          backgroundColor: 'rgba(66, 133, 244, 0.1)',
          borderLeftColor: '#4285f4'
        };
      } else {
        return {
          backgroundColor: 'rgba(95, 99, 104, 0.1)',
          borderLeftColor: '#5f6368'
        };
      }
    } else if (isGoogleMeet) {
      return {
        backgroundColor: 'rgba(52, 168, 83, 0.1)',
        borderLeftColor: calendarColor || '#34a853'
      };
    } else if (calendarColor) {
      const hex = calendarColor.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      return {
        backgroundColor: `rgba(${r}, ${g}, ${b}, 0.1)`,
        borderLeftColor: calendarColor
      };
    } else {
      return {
        backgroundColor: 'rgba(66, 133, 244, 0.1)',
        borderLeftColor: '#4285f4'
      };
    }
  };

  const isToday = (day) => {
    return moment().isSame(day, 'day');
  };

  const formatTime = (date) => {
    const hour = moment(date).hour();
    const minute = moment(date).minute();
    if (minute === 0) {
      if (hour === 0) return '12 AM';
      if (hour === 12) return '12 PM';
      if (hour < 12) return `${hour} AM`;
      return `${hour - 12} PM`;
    }
    return '';
  };

  const renderMonthView = () => {
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
                            setSelectedDayEvents(dayEvents.slice(3));
                            setSelectedDay(day);
                            setShowMoreEventsModal(true);
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
  };

  const renderDayView = () => {
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

                const colorStyle = getEventColorStyle(event);
                const startTime = moment(event.start).format('h:mm');
                const endTime = moment(event.end).format('h:mm A');
                const isGoogleMeet = event.resource?.isGoogleMeet;
                const isOverlapping = eventStyle.isOverlapping;

                return (
                  <div
                    key={event.id}
                    className="calendar-event"
                    style={{
                      top: eventStyle.top,
                      height: eventStyle.height,
                      width: eventStyle.width,
                      left: eventStyle.left,
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
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
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

                  const colorStyle = getEventColorStyle(event);
                  const startTime = moment(event.start).format('h:mm');
                  const endTime = moment(event.end).format('h:mm A');
                  const isGoogleMeet = event.resource?.isGoogleMeet;
                  const isOverlapping = eventStyle.isOverlapping;

                  return (
                    <div
                      key={event.id}
                      className="calendar-event"
                      style={{
                        top: eventStyle.top,
                        height: eventStyle.height,
                        width: eventStyle.width,
                        left: eventStyle.left,
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
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const formatEventTime = (event) => {
    const startTime = moment(event.start).format('h:mm A');
    const endTime = moment(event.end).format('h:mm A');
    return `${startTime} - ${endTime}`;
  };

  return (
    <>
      <div className="custom-calendar">
        {view === 'month' && renderMonthView()}
        {view === 'week' && renderWeekView()}
        {view === 'day' && renderDayView()}
      </div>
      {showMoreEventsModal && (
        <div 
          className="more-events-modal-overlay"
          onClick={() => setShowMoreEventsModal(false)}
        >
          <div 
            className="more-events-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="more-events-modal-header">
              <h3>Events for {selectedDay?.format('MMMM D, YYYY')}</h3>
              <button 
                className="more-events-close-btn"
                onClick={() => setShowMoreEventsModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="more-events-modal-content">
              {selectedDayEvents.map((event) => {
                const colorStyle = getEventColorStyle(event);
                const isGoogleMeet = event.resource?.isGoogleMeet;
                
                return (
                  <div
                    key={event.id}
                    className="more-events-item"
                    style={colorStyle}
                    onClick={() => {
                      onEventClick(event);
                      setShowMoreEventsModal(false);
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
      )}
    </>
  );
}

export default CustomCalendar;
