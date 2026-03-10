import { describe, it, expect } from '@jest/globals';
import { TASK_STATUS, TASK_PRIORITY } from '../../constants/index.js';
import {
  isValidTaskStatus,
  isValidTaskPriority,
  validateTaskData,
  validatePagination,
  validateDateRange,
} from '../validation.js';

describe('Validation', () => {
  describe('isValidTaskStatus', () => {
    it('should return true for valid task statuses', () => {
      expect(isValidTaskStatus(TASK_STATUS.TODO)).toBe(true);
      expect(isValidTaskStatus(TASK_STATUS.DONE)).toBe(true);
      expect(isValidTaskStatus('in-progress')).toBe(true);
      expect(isValidTaskStatus('in_progress')).toBe(true);
    });

    it('should return false for invalid task statuses', () => {
      expect(isValidTaskStatus('invalid')).toBe(false);
      expect(isValidTaskStatus('')).toBe(false);
      expect(isValidTaskStatus(null)).toBe(false);
      expect(isValidTaskStatus(undefined)).toBe(false);
    });
  });

  describe('isValidTaskPriority', () => {
    it('should return true for valid task priorities', () => {
      expect(isValidTaskPriority(TASK_PRIORITY.LOW)).toBe(true);
      expect(isValidTaskPriority(TASK_PRIORITY.MEDIUM)).toBe(true);
      expect(isValidTaskPriority(TASK_PRIORITY.HIGH)).toBe(true);
    });

    it('should return false for invalid task priorities', () => {
      expect(isValidTaskPriority('invalid')).toBe(false);
      expect(isValidTaskPriority('')).toBe(false);
      expect(isValidTaskPriority(null)).toBe(false);
    });
  });

  describe('validateTaskData', () => {
    it('should return valid for correct task data', () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test description',
        priority: TASK_PRIORITY.MEDIUM,
        status: TASK_STATUS.TODO,
        deadline: '2024-12-31',
      };

      const result = validateTaskData(taskData);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('should return error for missing title', () => {
      const taskData = { description: 'Test' };
      const result = validateTaskData(taskData);

      expect(result.isValid).toBe(false);
      expect(result.errors.title).toBe('Title is required');
    });

    it('should return error for empty title', () => {
      const taskData = { title: '   ' };
      const result = validateTaskData(taskData);

      expect(result.isValid).toBe(false);
      expect(result.errors.title).toBe('Title is required');
    });

    it('should return error for title too long', () => {
      const taskData = { title: 'a'.repeat(201) };
      const result = validateTaskData(taskData);

      expect(result.isValid).toBe(false);
      expect(result.errors.title).toBe('Title must be 200 characters or less');
    });

    it('should return error for description too long', () => {
      const taskData = {
        title: 'Test',
        description: 'a'.repeat(1001),
      };
      const result = validateTaskData(taskData);

      expect(result.isValid).toBe(false);
      expect(result.errors.description).toBe('Description must be 1000 characters or less');
    });

    it('should return error for invalid priority', () => {
      const taskData = {
        title: 'Test',
        priority: 'invalid',
      };
      const result = validateTaskData(taskData);

      expect(result.isValid).toBe(false);
      expect(result.errors.priority).toContain('Priority must be one of:');
    });

    it('should return error for invalid status', () => {
      const taskData = {
        title: 'Test',
        status: 'invalid',
      };
      const result = validateTaskData(taskData);

      expect(result.isValid).toBe(false);
      expect(result.errors.status).toContain('Status must be one of:');
    });

    it('should return error for invalid deadline', () => {
      const taskData = {
        title: 'Test',
        deadline: 'invalid-date',
      };
      const result = validateTaskData(taskData);

      expect(result.isValid).toBe(false);
      expect(result.errors.deadline).toBe('Invalid date format');
    });

    it('should accept valid deadline', () => {
      const taskData = {
        title: 'Test',
        deadline: '2024-12-31',
      };
      const result = validateTaskData(taskData);

      expect(result.isValid).toBe(true);
    });
  });

  describe('validatePagination', () => {
    it('should return default pagination values', () => {
      const result = validatePagination({});

      expect(result.page).toBe(1);
      expect(result.limit).toBe(50);
      expect(result.skip).toBe(0);
    });

    it('should parse valid pagination parameters', () => {
      const result = validatePagination({ page: '2', limit: '20' });

      expect(result.page).toBe(2);
      expect(result.limit).toBe(20);
      expect(result.skip).toBe(20);
    });

    it('should enforce minimum page of 1', () => {
      const result = validatePagination({ page: '0' });

      expect(result.page).toBe(1);
    });

    it('should enforce minimum limit of 1', () => {
      const result = validatePagination({ limit: '0' });

      expect(result.limit).toBe(1);
    });

    it('should enforce maximum limit of 100', () => {
      const result = validatePagination({ limit: '200' });

      expect(result.limit).toBe(100);
    });

    it('should calculate skip correctly', () => {
      const result = validatePagination({ page: '3', limit: '10' });

      expect(result.skip).toBe(20);
    });
  });

  describe('validateDateRange', () => {
    it('should return valid for correct date range', () => {
      const result = validateDateRange('2024-01-01', '2024-12-31');

      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('should return error for invalid start date', () => {
      const result = validateDateRange('invalid-date', '2024-12-31');

      expect(result.isValid).toBe(false);
      expect(result.errors.startDate).toBe('Invalid start date format');
    });

    it('should return error for invalid end date', () => {
      const result = validateDateRange('2024-01-01', 'invalid-date');

      expect(result.isValid).toBe(false);
      expect(result.errors.endDate).toBe('Invalid end date format');
    });

    it('should return error when start date is after end date', () => {
      const result = validateDateRange('2024-12-31', '2024-01-01');

      expect(result.isValid).toBe(false);
      expect(result.errors.dateRange).toBe('Start date must be before end date');
    });

    it('should accept valid single date', () => {
      const result = validateDateRange('2024-01-01', null);

      expect(result.isValid).toBe(true);
    });

    it('should accept Date objects', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-12-31');
      const result = validateDateRange(start, end);

      expect(result.isValid).toBe(true);
    });
  });
});
