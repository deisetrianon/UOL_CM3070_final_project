import moment from 'moment';

export function formatTime(seconds) {
  if (!seconds || seconds < 0) return '00:00';
  
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function formatDate(dateString, format = 'MMM D, YYYY') {
  if (!dateString) return '';
  
  try {
    return moment(dateString).format(format);
  } catch (error) {
    console.error('[formatDate] Error formatting date:', error);
    return '';
  }
}

export function formatDeadline(deadline) {
  if (!deadline) return null;
  
  try {
    const deadlineDate = moment(deadline);
    const now = moment();
    const diffDays = deadlineDate.diff(now, 'days', true);
    
    if (diffDays < 0) {
      return {
        text: 'Overdue',
        class: 'overdue',
        isOverdue: true,
      };
    } else if (diffDays < 1) {
      return {
        text: 'Today',
        class: 'today',
        isUrgent: true,
      };
    } else if (diffDays < 2) {
      return {
        text: 'Tomorrow',
        class: 'soon',
        isUrgent: true,
      };
    } else if (diffDays < 7) {
      return {
        text: formatDate(deadline),
        class: 'upcoming',
        isUrgent: false,
      };
    } else {
      return {
        text: formatDate(deadline),
        class: 'normal',
        isUrgent: false,
      };
    }
  } catch (error) {
    console.error('[formatDeadline] Error formatting deadline:', error);
    return {
      text: formatDate(deadline),
      class: 'normal',
      isUrgent: false,
    };
  }
}

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

export function isToday(date) {
  if (!date) return false;
  return moment(date).isSame(moment(), 'day');
}

