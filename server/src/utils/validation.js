import { TASK_STATUS, TASK_PRIORITY } from '../constants/index.js';

export function isValidTaskStatus(status) {
  return Object.values(TASK_STATUS).includes(status) || status === 'in_progress';
}

export function isValidTaskPriority(priority) {
  return Object.values(TASK_PRIORITY).includes(priority);
}

export function validateTaskData(taskData) {
  const errors = {};

  if (!taskData.title || taskData.title.trim().length === 0) {
    errors.title = 'Title is required';
  } else if (taskData.title.length > 200) {
    errors.title = 'Title must be 200 characters or less';
  }

  if (taskData.description && taskData.description.length > 1000) {
    errors.description = 'Description must be 1000 characters or less';
  }

  if (taskData.priority && !isValidTaskPriority(taskData.priority)) {
    errors.priority = `Priority must be one of: ${Object.values(TASK_PRIORITY).join(', ')}`;
  }

  if (taskData.status && !isValidTaskStatus(taskData.status)) {
    errors.status = `Status must be one of: ${Object.values(TASK_STATUS).join(', ')}`;
  }

  if (taskData.deadline) {
    const deadline = new Date(taskData.deadline);
    if (isNaN(deadline.getTime())) {
      errors.deadline = 'Invalid date format';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validatePagination(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 50));
  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip,
  };
}

export function validateDateRange(startDate, endDate) {
  const errors = {};

  if (startDate) {
    const start = new Date(startDate);
    if (isNaN(start.getTime())) {
      errors.startDate = 'Invalid start date format';
    }
  }

  if (endDate) {
    const end = new Date(endDate);
    if (isNaN(end.getTime())) {
      errors.endDate = 'Invalid end date format';
    }
  }

  if (startDate && endDate && !errors.startDate && !errors.endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      errors.dateRange = 'Start date must be before end date';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
