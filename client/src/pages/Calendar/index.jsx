import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import { useZenMode } from '../../contexts/ZenModeContext';
import { useDialog } from '../../contexts/DialogContext';
import Layout from '../../components/Layout';
import CustomCalendar from '../../components/CustomCalendar';
import importantIcon from '../../assets/icons/important.png';
import './Calendar.css';

function CalendarPage() {
  const { isZenModeActive, autoTriggeredReason } = useZenMode();
  const { showAlert } = useDialog();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('week');
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

  // Fetching events when date or view changes
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

  const handleNavigate = (newDate) => {
    if (newDate instanceof Date) {
      setCurrentDate(newDate);
    }
  };

  const handleSelectEvent = (event) => {
    const isTask = event.resource?.type === 'task';
    const isGoogleMeet = event.resource?.isGoogleMeet;
    const meetLink = event.resource?.meetLink;
    const isCalendarEvent = event.resource?.type === 'calendar';

    if (isTask) {
      navigate('/tasks');
      return;
    }

    if (isGoogleMeet && meetLink) {
      window.open(meetLink, '_blank', 'noopener,noreferrer');
      return;
    }

    if (isCalendarEvent && !isTask) {
      window.open('https://calendar.google.com/calendar/r', '_blank', 'noopener,noreferrer');
      return;
    }

    let message = `\nTitle: ${event.title}\n`;
    
    if (event.resource?.description) {
      message += `Description: ${event.resource.description}\n`;
    }
    
    if (event.resource?.location) {
      message += `Location: ${event.resource.location}\n`;
    }

    if (isGoogleMeet) {
      message += `\nType: Google Meet\n`;
      if (meetLink) {
        message += `Meet Link: ${meetLink}\n`;
      }
    } else if (isCalendarEvent) {
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
      const startDate = moment(currentDate).startOf('week').toDate();
      const endDate = moment(currentDate).endOf('week').toDate();
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
        <div className="calendar-header-section">
          <div className="calendar-header-left">
            <h1>Calendar</h1>
            <div className="calendar-view-buttons">
              <button 
                className={`view-btn ${view === 'month' ? 'active' : ''}`}
                onClick={() => setView('month')}
              >
                Month
              </button>
              <button 
                className={`view-btn ${view === 'week' ? 'active' : ''}`}
                onClick={() => setView('week')}
              >
                Week
              </button>
              <button 
                className={`view-btn ${view === 'day' ? 'active' : ''}`}
                onClick={() => setView('day')}
              >
                Day
              </button>
            </div>
            <div className="calendar-nav-buttons">
              <button 
                className={`nav-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => handleFilterChange('all')}
              >
                All
              </button>
              <button 
                className={`nav-btn ${filter === 'meetings' ? 'active' : ''}`}
                onClick={() => handleFilterChange('meetings')}
              >
                Meetings
              </button>
              <button 
                className={`nav-btn ${filter === 'tasks' ? 'active' : ''}`}
                onClick={() => handleFilterChange('tasks')}
              >
                Tasks
              </button>
            </div>
          </div>
          <div className="calendar-header-right">
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
        {isZenModeActive && (
          <div className="zen-mode-banner">
            <div className="zen-banner-text">
              <strong>Zen Mode Active</strong>
              <span>
                {autoTriggeredReason || 'Showing only Meetings, Urgent & High Priority Tasks'}
              </span>
            </div>
          </div>
        )}
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
                const startDate = moment(currentDate).startOf('week').toDate();
                const endDate = moment(currentDate).endOf('week').toDate();
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
        <div className="calendar-main">
          <div className="calendar-container">
            {loading ? (
              <div className="calendar-loading">
                <div className="loading-spinner"></div>
                <p>Loading calendar events...</p>
              </div>
            ) : (
              <CustomCalendar
                events={events}
                currentDate={currentDate}
                view={view}
                onEventClick={handleSelectEvent}
                onNavigate={handleNavigate}
              />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default CalendarPage;
