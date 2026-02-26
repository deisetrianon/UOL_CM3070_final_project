import { useState, useEffect, useCallback } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { useZenMode } from '../../contexts/ZenModeContext';
import { useDialog } from '../../contexts/DialogContext';
import Layout from '../../components/Layout';
import importantIcon from '../../assets/icons/important.png';
import './Calendar.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

function CalendarPage() {
  const { isZenModeActive } = useZenMode();
  const { showAlert } = useDialog();
  const [events, setEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month');
  const [calendarEventsCount, setCalendarEventsCount] = useState(0);
  const [taskEventsCount, setTaskEventsCount] = useState(0);
  const [filter, setFilter] = useState('all'); // 'all', 'tasks', 'meetings'

  const applyZenModeFilter = useCallback((eventsList) => {
    if (!isZenModeActive) {
      return eventsList;
    }

    return eventsList.filter(event => {
      const isTask = event.resource?.type === 'task';
      const isCalendarEvent = event.resource?.type === 'calendar';
      const taskPriority = event.resource?.taskPriority;
      const taskIsUrgent = event.resource?.taskIsUrgent;

      if (isCalendarEvent) {
        return true;
      }

      if (isTask && (taskIsUrgent || taskPriority === 'urgent')) {
        return true;
      }

      if (isTask && taskPriority === 'high') {
        return true;
      }

      return false;
    });
  }, [isZenModeActive]);

  const applyFilters = useCallback((eventsList, currentFilter, zenModeActive) => {
    let filteredEvents = zenModeActive ? applyZenModeFilter(eventsList) : eventsList;

    if (currentFilter === 'all') {
      setEvents(filteredEvents);
    } else if (currentFilter === 'tasks') {
      setEvents(filteredEvents.filter(event => event.resource?.type === 'task'));
    } else if (currentFilter === 'meetings') {
      setEvents(filteredEvents.filter(event => event.resource?.type === 'calendar'));
    }
  }, [applyZenModeFilter]);

  // Fetch combined events (Google Calendar + Tasks)
  const fetchEvents = useCallback(async (startDate, endDate) => {
    try {
      setLoading(true);
      setError(null);

      const timeMin = moment(startDate).startOf('day').toISOString();
      const timeMax = moment(endDate).endOf('day').toISOString();

      const response = await fetch(
        `/api/calendar/combined?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`,
        {
          credentials: 'include'
        }
      );

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          const text = await response.text();
          if (text) errorMessage = text;
        }
        throw new Error(errorMessage);
      }

      const contentType = response.headers.get('content-type');

      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Unexpected response format: ${text || 'Empty response'}`);
      }

      const data = await response.json();

      if (data.success) {
        const formattedEvents = data.events.map(event => ({
          id: event.id,
          title: event.title,
          start: new Date(event.start),
          end: new Date(event.end),
          allDay: event.isAllDay,
          resource: {
            type: event.isTask ? 'task' : 'calendar',
            isGoogleMeet: event.isGoogleMeet,
            meetLink: event.meetLink,
            location: event.location,
            description: event.description,
            taskId: event.taskId,
            taskPriority: event.taskPriority,
            taskStatus: event.taskStatus,
            taskIsUrgent: event.taskIsUrgent,
            attendees: event.attendees,
            organizer: event.organizer,
            calendarId: event.calendarId,
            calendarName: event.calendarName,
            calendarColor: event.calendarColor
          }
        }));

        setAllEvents(formattedEvents);
        setCalendarEventsCount(data.calendarEventsCount || 0);
        setTaskEventsCount(data.taskEventsCount || 0);
        
        // Applying filters (Zen Mode + user filter)
        applyFilters(formattedEvents, filter, isZenModeActive);

        if (data.calendarError) {
          if (data.calendarError.message === 'INSUFFICIENT_SCOPES' || data.calendarError.status === 403) {
            setError('Calendar access not granted. Please log out and log in again to grant calendar permissions. Tasks are still shown below.');
          } else if (data.calendarError.message === 'CALENDAR_API_NOT_ENABLED') {
            setError('Calendar API not enabled. Please enable it in Google Cloud Console. Tasks are still shown below.');
          } else {
            setError(`Calendar error: ${data.calendarError.message}. Tasks are still shown below.`);
          }
        }
      } else {
        console.error('[Calendar] API Error:', data);
        setError(data.error || 'Failed to fetch calendar events');
      }
    } catch (err) {
      console.error('[Calendar] Error fetching events:', err);
      setError('Failed to load calendar events. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filter, isZenModeActive, applyFilters]);

  // Fetching events when view or date changes
  useEffect(() => {
    let startDate, endDate;

    if (view === 'month') {
      startDate = moment(currentDate).startOf('month').toDate();
      endDate = moment(currentDate).endOf('month').toDate();
    } else if (view === 'week') {
      startDate = moment(currentDate).startOf('week').toDate();
      endDate = moment(currentDate).endOf('week').toDate();
    } else if (view === 'day') {
      startDate = moment(currentDate).startOf('day').toDate();
      endDate = moment(currentDate).endOf('day').toDate();
    } else {
      // Agenda view - showing next 30 days
      startDate = moment(currentDate).startOf('day').toDate();
      endDate = moment(currentDate).add(30, 'days').endOf('day').toDate();
    }

    fetchEvents(startDate, endDate);
  }, [currentDate, view, fetchEvents]);

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    applyFilters(allEvents, newFilter, isZenModeActive);
  };

  // Re-applying filters when Zen Mode changes
  useEffect(() => {
    applyFilters(allEvents, filter, isZenModeActive);
  }, [isZenModeActive, allEvents, filter, applyFilters]);

  const eventStyleGetter = (event) => {
    const isTask = event.resource?.type === 'task';
    const isGoogleMeet = event.resource?.isGoogleMeet;
    const taskPriority = event.resource?.taskPriority;
    const taskIsUrgent = event.resource?.taskIsUrgent;
    const calendarColor = event.resource?.calendarColor;

    let backgroundColor = '#3174ad';
    let borderColor = '#3174ad';
    let style = {};

    if (isTask) {
      if (taskIsUrgent || taskPriority === 'urgent') {
        backgroundColor = '#ef4444';
        borderColor = '#dc2626';
      } else if (taskPriority === 'high') {
        backgroundColor = '#f59e0b';
        borderColor = '#d97706';
      } else if (taskPriority === 'medium') {
        backgroundColor = '#3b82f6';
        borderColor = '#2563eb';
      } else {
        backgroundColor = '#6b7280';
        borderColor = '#4b5563';
      }
    } else if (isGoogleMeet) {
      backgroundColor = calendarColor || '#10b981';
      borderColor = calendarColor || '#059669';
    } else if (calendarColor) {
      backgroundColor = calendarColor;
      borderColor = calendarColor;
    }

    const getTextColor = (bgColor) => {
      if (!bgColor) return 'white';
      const hex = bgColor.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness > 128 ? '#000000' : '#ffffff';
    };

    style = {
      backgroundColor,
      borderColor,
      borderWidth: '2px',
      borderRadius: '4px',
      color: getTextColor(backgroundColor),
      opacity: 0.9
    };

    return { style };
  };

  const EventComponent = ({ event }) => {
    const isTask = event.resource?.type === 'task';
    const isGoogleMeet = event.resource?.isGoogleMeet;
    
    return (
      <div className="calendar-event-content">
        {isTask && <span className="event-icon">📋</span>}
        {isGoogleMeet && <span className="event-icon">📹</span>}
        {!isTask && !isGoogleMeet && <span className="event-icon">📅</span>}
        <span className="event-title">{event.title}</span>
      </div>
    );
  };

  const handleNavigate = (newDate) => {
    setCurrentDate(newDate);
  };

  const handleViewChange = (newView) => {
    setView(newView);
  };

  const handleSelectEvent = (event) => {
    const isTask = event.resource?.type === 'task';
    const isGoogleMeet = event.resource?.isGoogleMeet;
    const meetLink = event.resource?.meetLink;

    let message = `\nTitle: ${event.title}\n`;
    
    if (event.resource?.description) {
      message += `Description: ${event.resource.description}\n`;
    }
    
    if (event.resource?.location) {
      message += `Location: ${event.resource.location}\n`;
    }

    if (isTask) {
      message += `\nType: Task\n`;
      message += `Priority: ${event.resource?.taskPriority || 'N/A'}\n`;
      message += `Status: ${event.resource?.taskStatus || 'N/A'}\n`;
      if (event.resource?.taskIsUrgent) {
        message += `Urgent\n`;
      }
    } else if (isGoogleMeet) {
      message += `\nType: Google Meet\n`;
      if (meetLink) {
        message += `Meet Link: ${meetLink}\n`;
      }
    } else {
      message += `\nType: Calendar Event\n`;
      if (event.resource?.calendarName) {
        message += `Calendar: ${event.resource.calendarName}\n`;
      }
    }

    if (event.resource?.organizer) {
      message += `Organizer: ${event.resource.organizer}\n`;
    }

    showAlert(message, 'info');
  };

  if (loading) {
    return (
      <Layout>
        <div className="calendar-page">
          <div className="calendar-loading">
            <div className="loading-spinner"></div>
            <p>Loading calendar events...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    const handleRetry = () => {
      let startDate, endDate;
      if (view === 'month') {
        startDate = moment(currentDate).startOf('month').toDate();
        endDate = moment(currentDate).endOf('month').toDate();
      } else if (view === 'week') {
        startDate = moment(currentDate).startOf('week').toDate();
        endDate = moment(currentDate).endOf('week').toDate();
      } else if (view === 'day') {
        startDate = moment(currentDate).startOf('day').toDate();
        endDate = moment(currentDate).endOf('day').toDate();
      } else {
        startDate = moment(currentDate).startOf('day').toDate();
        endDate = moment(currentDate).add(30, 'days').endOf('day').toDate();
      }
      fetchEvents(startDate, endDate);
    };

    return (
      <Layout>
        <div className="calendar-page">
          <div className="calendar-error">
            <p>
              <img src={importantIcon} alt="Warning" className="warning-icon" /> {error}
            </p>
            <button onClick={handleRetry} className="retry-button">
              Retry
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="calendar-page">
        <div className="calendar-header">
          <h1>📅 Calendar</h1>
          <div className="calendar-header-right">
            {isZenModeActive && (
              <div className="zen-mode-banner" style={{
                padding: 'var(--spacing-xs) var(--spacing-md)',
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid #22c55e',
                borderRadius: 'var(--radius-md)',
                color: '#22c55e',
                fontSize: '0.875rem',
                fontWeight: 500,
                marginRight: 'var(--spacing-md)'
              }}>
                Zen Mode: Showing only Meetings, Urgent & High Priority Tasks
              </div>
            )}
            <div className="calendar-filters">
              <button
                className={`filter-button ${filter === 'all' ? 'active' : ''}`}
                onClick={() => handleFilterChange('all')}
              >
                All
              </button>
              <button
                className={`filter-button ${filter === 'meetings' ? 'active' : ''}`}
                onClick={() => handleFilterChange('meetings')}
              >
                Meetings
              </button>
              <button
                className={`filter-button ${filter === 'tasks' ? 'active' : ''}`}
                onClick={() => handleFilterChange('tasks')}
              >
                Tasks
              </button>
            </div>
            <div className="calendar-stats">
              <span className="stat-item">
                <span className="stat-label">Meetings:</span>
                <span className="stat-value">{calendarEventsCount}</span>
              </span>
              <span className="stat-item">
                <span className="stat-label">Tasks:</span>
                <span className="stat-value">{taskEventsCount}</span>
              </span>
            </div>
          </div>
        </div>
        {error && (
          <div className="calendar-warning" style={{ 
            padding: 'var(--spacing-md)', 
            marginBottom: 'var(--spacing-md)',
            background: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: 'var(--radius-md)',
            color: '#92400e'
          }}>
            <p style={{ margin: 0 }}>{error}</p>
            <button 
              onClick={() => {
                setError(null);
                const startDate = moment(currentDate).startOf('month').toDate();
                const endDate = moment(currentDate).endOf('month').toDate();
                fetchEvents(startDate, endDate);
              }}
              style={{
                marginTop: 'var(--spacing-sm)',
                padding: 'var(--spacing-xs) var(--spacing-sm)',
                background: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              Dismiss
            </button>
          </div>
        )}
        <div className="calendar-container">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 600 }}
            view={view}
            onView={handleViewChange}
            date={currentDate}
            onNavigate={handleNavigate}
            eventPropGetter={eventStyleGetter}
            components={{
              event: EventComponent
            }}
            onSelectEvent={handleSelectEvent}
            popup
            showMultiDayTimes
            formats={{
              eventTimeRangeFormat: () => ''
            }}
          />
        </div>
      </div>
    </Layout>
  );
}

export default CalendarPage;
