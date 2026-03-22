/**
 * Date and time utility functions.
 * Provides formatting and manipulation functions for dates, times, and deadlines.
 * 
 * @module date
 */

import moment from 'moment';

/**
 * Formats seconds into MM:SS format.
 * 
 * @param {number} seconds - The number of seconds to format
 * @returns {string} Formatted time string (MM:SS)
 */
export function formatTime(seconds) {
  if (!seconds || seconds < 0) return '00:00';
  
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Formats a date string using moment.js format tokens.
 * 
 * @param {string|Date} dateString - The date to format
 * @param {string} format - The moment.js format string (default: 'MMM D, YYYY')
 * @returns {string} Formatted date string
 */
export function formatDate(dateString, format = 'MMM D, YYYY') {
  if (!dateString) return '';
  
  try {
    return moment(dateString).format(format);
  } catch (error) {
    console.error('[formatDate] Error formatting date:', error);
    return '';
  }
}

/**
 * Formats a task deadline text using the UTC calendar date
 * Matches HTML date input values (YYYY-MM-DD) so the label is never one day off from the picker in local timezones behind UTC
 *
 * @param {string|Date} deadline - Task deadline
 * @param {string} format - moment.js format
 * @returns {string}
 */
export function formatDeadlineCalendarDate(deadline, format = 'MMM D, YYYY') {
  if (!deadline) return '';
  try {
    return moment.utc(deadline).format(format);
  } catch (error) {
    console.error('[formatDeadlineCalendarDate] Error formatting deadline:', error);
    return '';
  }
}

/**
 * Formats a deadline date with contextual information (overdue, today, tomorrow, etc.).
 * 
 * @param {string|Date} deadline - The deadline date
 * @returns {Object|null} Object with text, class, and urgency flags, or null if no deadline
 */
export function formatDeadline(deadline) {
  if (!deadline) return null;
  
  try {
    const deadlineUtc = moment.utc(deadline);
    const nowUtc = moment.utc();
    const diffDays = deadlineUtc.startOf('day').diff(nowUtc.startOf('day'), 'days');
    
    if (diffDays < 0) {
      return {
        text: 'Overdue',
        class: 'overdue',
        isOverdue: true,
      };
    } else if (diffDays === 0) {
      return {
        text: 'Today',
        class: 'today',
        isUrgent: true,
      };
    } else if (diffDays === 1) {
      return {
        text: 'Tomorrow',
        class: 'soon',
        isUrgent: true,
      };
    } else if (diffDays < 7) {
      return {
        text: formatDeadlineCalendarDate(deadline),
        class: 'upcoming',
        isUrgent: false,
      };
    } else {
      return {
        text: formatDeadlineCalendarDate(deadline),
        class: 'normal',
        isUrgent: false,
      };
    }
  } catch (error) {
    console.error('[formatDeadline] Error formatting deadline:', error);
    return {
      text: formatDeadlineCalendarDate(deadline),
      class: 'normal',
      isUrgent: false,
    };
  }
}

/**
 * Gets the start and end dates for a calendar view (month, week, or day).
 * 
 * @param {string} view - The view type ('month', 'week', or 'day')
 * @param {Date|string} currentDate - The current date to base the range on
 * @returns {Object} Object with startDate and endDate
 */
export function getDateRange(view, currentDate) {
  const date = moment(currentDate);
  
  switch (view) {
    case 'month':
      return {
        startDate: date.clone().startOf('month').toDate(),
        endDate: date.clone().endOf('month').toDate(),
      };
    case 'week':
      return {
        startDate: date.clone().startOf('week').toDate(),
        endDate: date.clone().endOf('week').toDate(),
      };
    case 'day':
      return {
        startDate: date.clone().startOf('day').toDate(),
        endDate: date.clone().endOf('day').toDate(),
      };
    default:
      return {
        startDate: date.clone().startOf('month').toDate(),
        endDate: date.clone().endOf('month').toDate(),
      };
  }
}

/**
 * Checks if a date is today.
 * 
 * @param {string|Date} date - The date to check
 * @returns {boolean} True if the date is today
 */
export function isToday(date) {
  if (!date) return false;
  return moment(date).isSame(moment(), 'day');
}

/**
 * Checks if the deadline falls on today's calendar date (UTC)
 * Used for task deadlines so ISO date-only values match HTML date inputs
 *
 * @param {string|Date} deadline - Task deadline
 * @returns {boolean}
 */
export function isDeadlineToday(deadline) {
  if (!deadline) return false;
  return moment.utc(deadline).isSame(moment.utc(), 'day');
}

