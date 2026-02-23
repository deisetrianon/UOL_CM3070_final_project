import { useState, useEffect, useRef } from 'react';
import { useZenMode } from '../../contexts/ZenModeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useWellnessIntervention } from '../../contexts/WellnessInterventionContext';
import './MeetingReminderNotification.css';

function MeetingReminderNotification() {
  const { isZenModeActive } = useZenMode();
  const { isAuthenticated } = useAuth();
  const { openBreathing, openAnxietyRelief } = useWellnessIntervention();
  const [upcomingMeeting, setUpcomingMeeting] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [recommendedExercise, setRecommendedExercise] = useState(null); // 'breathing' or 'anxietyRelief'
  const dismissedMeetingsRef = useRef(new Set());

  // Checking for upcoming meetings every minute
  useEffect(() => {
    if (!isAuthenticated || !isZenModeActive) {
      setUpcomingMeeting(null);
      setIsVisible(false);
      return;
    }

    const checkUpcomingMeetings = async () => {
      try {
        const now = new Date();
        const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000);
        
        // Fetching events for the next 10 minutes
        const timeMin = now.toISOString();
        const timeMax = tenMinutesFromNow.toISOString();

        const response = await fetch(
          `/api/calendar/combined?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`,
          {
            credentials: 'include'
          }
        );

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        if (!data.success || !data.events) {
          return;
        }

        const upcomingMeetEvent = data.events.find(event => {
          if (dismissedMeetingsRef.current.has(event.id)) return false;
          
          if (event.isTask) return false;
          
          const isGoogleMeet = event.isGoogleMeet || 
                              (event.resource?.isGoogleMeet) ||
                              (event.meetLink) ||
                              (event.resource?.meetLink);
          
          if (!isGoogleMeet) return false;
          
          // Checking if it starts within 10 minutes
          const eventStart = new Date(event.start);
          if (isNaN(eventStart.getTime())) return false;
          
          const timeUntilStart = eventStart.getTime() - now.getTime();
          const tenMinutesInMs = 10 * 60 * 1000;
          
          return timeUntilStart > 0 && timeUntilStart <= tenMinutesInMs;
        });

        if (upcomingMeetEvent) {
          setUpcomingMeeting(upcomingMeetEvent);
          // Randomly choosing between breathing and anxiety relief exercise
          const exerciseType = Math.random() < 0.5 ? 'breathing' : 'anxietyRelief';
          setRecommendedExercise(exerciseType);
          setIsVisible(true);
        } else {
          setUpcomingMeeting(null);
          setIsVisible(false);
          setRecommendedExercise(null);
        }
      } catch (error) {
        console.error('[MeetingReminder] Error checking meetings:', error);
      }
    };

    // Checking immediately
    checkUpcomingMeetings();
    // Then checking every minute
    const interval = setInterval(checkUpcomingMeetings, 60 * 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, isZenModeActive]);

  const handleDismiss = () => {
    if (upcomingMeeting) {
      dismissedMeetingsRef.current.add(upcomingMeeting.id);
    }
    setIsExiting(true);
    setTimeout(() => {
      setIsExiting(false);
      setUpcomingMeeting(null);
      setIsVisible(false);
      setRecommendedExercise(null);
    }, 300);
  };

  const handleTryExercise = () => {
    if (recommendedExercise === 'breathing') {
      openBreathing();
    } else if (recommendedExercise === 'anxietyRelief') {
      openAnxietyRelief();
    }
  };

  const formatTimeUntil = (eventStart) => {
    const now = new Date();
    const timeUntil = eventStart.getTime() - now.getTime();
    const minutes = Math.floor(timeUntil / (60 * 1000));
    
    if (minutes <= 0) {
      return 'starting now';
    } else if (minutes === 1) {
      return 'in 1 minute';
    } else {
      return `in ${minutes} minutes`;
    }
  };

  const formatEventDate = (eventStart) => {
    const date = new Date(eventStart);
    const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const day = date.getDate();
    return { month, day };
  };

  if (!upcomingMeeting || !isVisible) return null;

  const eventStart = new Date(upcomingMeeting.start);
  const eventTitle = upcomingMeeting.title || '(No Title)';
  const meetLink = upcomingMeeting.meetLink || upcomingMeeting.resource?.meetLink || null;
  const { month, day } = formatEventDate(eventStart);

  return (
    <div className={`meeting-reminder ${isVisible ? 'visible' : ''} ${isExiting ? 'exiting' : ''}`}>
      <div className="meeting-reminder-content">
        <button className="close-btn" onClick={handleDismiss} title="Dismiss">
          ✕
        </button>
        <div className="meeting-reminder-header">
          <div className="meeting-reminder-calendar-icon">
            <div className="calendar-month">{month}</div>
            <div className="calendar-day">{day}</div>
          </div>
          <div className="meeting-reminder-text">
            <h4>Upcoming Meeting</h4>
            <p className="meeting-details">
              <strong>{eventTitle}</strong> is starting {formatTimeUntil(eventStart)}.
            </p>
            {isZenModeActive && (
              <p className="anxiety-message">
                Feeling anxious before a presentation or meeting? Try a quick exercise to calm your nerves.
              </p>
            )}
          </div>
        </div>
        <div className="meeting-reminder-actions">
          {isZenModeActive && recommendedExercise && (
            <button className="exercise-btn" onClick={handleTryExercise}>
              <span>
                {recommendedExercise === 'breathing' ? '🫁' : '🧘'}
              </span>
              {recommendedExercise === 'breathing' ? 'Breathing Exercise' : 'Anxiety Relief'}
            </button>
          )}
          {meetLink && (
            <a 
              href={meetLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="join-btn"
            >
              <span>🎥</span> Join Meeting
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default MeetingReminderNotification;
