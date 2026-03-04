import { useMemo, useState } from 'react';
import moment from 'moment';
import CalendarMonthView from './CalendarMonthView';
import CalendarWeekView from './CalendarWeekView';
import CalendarDayView from './CalendarDayView';
import MoreEventsModal from './MoreEventsModal';
import { getEventColorStyle } from './calendarUtils';
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

  const handleShowMoreEvents = (events, day) => {
    setSelectedDayEvents(events);
    setSelectedDay(day);
    setShowMoreEventsModal(true);
  };

  return (
    <>
      <div className="custom-calendar">
        {view === 'month' && (
          <CalendarMonthView
            currentDate={currentDate}
            events={events}
            onEventClick={onEventClick}
            onNavigate={onNavigate}
            onShowMoreEvents={handleShowMoreEvents}
          />
        )}
        {view === 'week' && (
          <CalendarWeekView
            weekDays={weekDays}
            timeSlots={timeSlots}
            events={events}
            onEventClick={onEventClick}
            calculateEventLayout={calculateEventLayout}
            getEventsForDay={getEventsForDay}
            isToday={isToday}
            formatTime={formatTime}
          />
        )}
        {view === 'day' && (
          <CalendarDayView
            currentDate={currentDate}
            timeSlots={timeSlots}
            events={events}
            onEventClick={onEventClick}
            calculateEventLayout={calculateEventLayout}
            getEventsForDay={getEventsForDay}
            isToday={isToday}
            formatTime={formatTime}
          />
        )}
      </div>
      {showMoreEventsModal && (
        <MoreEventsModal
          events={selectedDayEvents}
          selectedDay={selectedDay}
          onEventClick={onEventClick}
          onClose={() => setShowMoreEventsModal(false)}
          getEventColorStyle={getEventColorStyle}
        />
      )}
    </>
  );
}

export default CustomCalendar;
