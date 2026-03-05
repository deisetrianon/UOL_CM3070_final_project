/**
 * Calendar utility functions.
 * Provides helper functions for calendar event styling and date calculations.
 * 
 * @module components/CustomCalendar/calendarUtils
 */

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
