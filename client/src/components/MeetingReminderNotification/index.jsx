/**
 * Meeting Reminder Notification component.
 * Displays notifications for upcoming Google Meet meetings with wellness exercise recommendations.
 * Suggests breathing or anxiety relief exercises before meetings.
 * 
 * @module components/MeetingReminderNotification
 * @component
 * @returns {JSX.Element|null} Meeting Reminder Notification component or null if no upcoming meeting
 */

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useStressFusion } from '../../contexts/StressFusionContext';
import { useWellnessIntervention } from '../../contexts/WellnessInterventionContext';
import breathingIcon from '../../assets/icons/breathing.png';
import anxietyIcon from '../../assets/icons/anxiety.png';
import videoIcon from '../../assets/icons/videocall.png';
import './MeetingReminderNotification.css';

function MeetingReminderNotification() {
  const { isAuthenticated } = useAuth();
  const { isZenModeActive, notificationSettings } = useNotification();
  const { stressLevel } = useStressFusion();
  const { openBreathing, openAnxietyRelief } = useWellnessIntervention();
  const [upcomingMeeting, setUpcomingMeeting] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [recommendedExercise, setRecommendedExercise] = useState(null); // 'breathing' or 'anxietyRelief'
  const dismissedMeetingsRef = useRef(new Set());

  useEffect(() => {
    const meetingNotificationsEnabled = notificationSettings?.email ?? true;
    const hasStressOrZenMode = isZenModeActive || stressLevel === 'moderate' || stressLevel === 'high';
    const shouldShow = isAuthenticated && meetingNotificationsEnabled && hasStressOrZenMode;
    
    if (!shouldShow) {
      setUpcomingMeeting(null);
      setIsVisible(false);
      return;
    }

    const checkUpcomingMeetings = async () => {
      try {
        const now = new Date();
        const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000);
        
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
          
          const eventStart = new Date(event.start);
          if (isNaN(eventStart.getTime())) return false;
          
          const timeUntilStart = eventStart.getTime() - now.getTime();
          const tenMinutesInMs = 10 * 60 * 1000;
          
          return timeUntilStart > 0 && timeUntilStart <= tenMinutesInMs;
        });

        if (upcomingMeetEvent) {
          setUpcomingMeeting(upcomingMeetEvent);
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

    checkUpcomingMeetings();
    const interval = setInterval(checkUpcomingMeetings, 60 * 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, isZenModeActive, stressLevel, notificationSettings]);

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
      return 'now';
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
            <p className="anxiety-message">
              Feeling anxious before a presentation or meeting? Try a quick exercise to calm your nerves.
            </p>
          </div>
        </div>
        <div className="meeting-reminder-actions">
          {recommendedExercise && (
            <button className="exercise-btn" onClick={handleTryExercise}>
              <img 
                src={recommendedExercise === 'breathing' ? breathingIcon : anxietyIcon} 
                alt={recommendedExercise === 'breathing' ? 'Breathing' : 'Anxiety Relief'}
                className="exercise-icon"
              />
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
              <img src={videoIcon} alt="Video" className="exercise-icon" />
              Join Meeting
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default MeetingReminderNotification;
