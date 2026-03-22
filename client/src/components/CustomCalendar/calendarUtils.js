/**
 * Calendar utility functions.
 * Provides helper functions for calendar event styling and date calculations.
 * 
 * @module components/CustomCalendar/calendarUtils
 */

import moment from 'moment';

/**
 * Decides if an event should appear on a given calendar cell (local day)
 * Tasks use UTC deadline calendar date to match the task cards
 *
 * @param {Object} event - Calendar event
 * @param {import('moment').Moment} day - Calendar day column
 * @returns {boolean}
 */
export function eventOccursOnCalendarDay(event, day) {
  const dayMoment = moment.isMoment(day) ? day : moment(day);
  const dayKey = dayMoment.format('YYYY-MM-DD');
  if (event.resource?.type === 'task' && event.resource?.deadlineDate) {
    return event.resource.deadlineDate === dayKey;
  }
  return moment(event.start).isSame(dayMoment, 'day');
}

/**
 * Start/end moments for laying out an event in a day column 
 *
 * @param {Object} event
 * @param {import('moment').Moment} day
 * @returns {{ start: import('moment').Moment, end: import('moment').Moment }}
 */
export function getEventLayoutRange(event, day) {
  if (event.resource?.type === 'task' && event.resource?.deadlineDate) {
    const start = day.clone().hour(6).minute(0).second(0).millisecond(0);
    const end = start.clone().add(1, 'hour');
    return { start, end };
  }
  return {
    start: moment(event.start),
    end: moment(event.end),
  };
}

/**
 * Gets the color style for a calendar event based on its type and properties.
 * 
 * @param {Object} event - Calendar event object
 * @returns {Object} CSS style object with backgroundColor and borderColor
 */
export function getEventColorStyle(event) {
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
}
