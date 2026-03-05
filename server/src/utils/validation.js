/**
 * Server-side validation utility functions.
 * Provides validation for tasks, pagination, and date ranges.
 * 
 * @module utils/validation
 */

import { TASK_STATUS, TASK_PRIORITY } from '../constants/index.js';

/**
 * Validates if a task status is valid.
 * 
 * @param {string} status - The task status to validate
 * @returns {boolean} True if the status is valid
 */
export function isValidTaskStatus(status) {
  return Object.values(TASK_STATUS).includes(status) || status === 'in_progress';
}

/**
 * Validates if a task priority is valid.
 * 
 * @param {string} priority - The task priority to validate
 * @returns {boolean} True if the priority is valid
 */
export function isValidTaskPriority(priority) {
  return Object.values(TASK_PRIORITY).includes(priority);
}

/**
 * Validates task data and returns validation errors if any.
 * 
 * @param {Object} taskData - The task data to validate
 * @returns {Object} Validation result with isValid flag and errors object
 */
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

/**
 * Validates and normalizes pagination query parameters.
 * 
 * @param {Object} query - Query parameters with page and limit
 * @returns {Object} Normalized pagination object with page, limit, and skip
 */
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

/**
 * Validates a date range (start and end dates).
 * 
 * @param {string|Date} startDate - The start date
 * @param {string|Date} endDate - The end date
 * @returns {Object} Validation result with isValid flag and errors object
 */
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
