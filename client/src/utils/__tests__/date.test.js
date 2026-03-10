import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import moment from 'moment';
import {
  formatTime,
  formatDate,
  formatDeadline,
  getDateRange,
  isToday,
} from '../date.js';

describe('Date Utilities', () => {
  describe('formatTime', () => {
    it('should format seconds to MM:SS', () => {
      expect(formatTime(0)).toBe('00:00');
      expect(formatTime(30)).toBe('00:30');
      expect(formatTime(65)).toBe('01:05');
      expect(formatTime(3665)).toBe('61:05');
    });

    it('should return 00:00 for invalid inputs', () => {
      expect(formatTime(null)).toBe('00:00');
      expect(formatTime(undefined)).toBe('00:00');
      expect(formatTime(-1)).toBe('00:00');
    });
  });

  describe('formatDate', () => {
    it('should format date with default format', () => {
      const date = '2024-01-15';
      const result = formatDate(date);
      expect(result).toBe('Jan 15, 2024');
    });

    it('should format date with custom format', () => {
      const date = '2024-01-15';
      const result = formatDate(date, 'YYYY-MM-DD');
      expect(result).toBe('2024-01-15');
    });

    it('should handle Date objects', () => {
      const date = new Date('2024-01-15T12:00:00Z');
      const result = formatDate(date);
      expect(result).toContain('2024');
      expect(result).toContain('Jan');
    });

    it('should return empty string for invalid date', () => {
      expect(formatDate(null)).toBe('');
      expect(formatDate(undefined)).toBe('');
      expect(formatDate('')).toBe('');
    });

    it('should handle invalid date strings gracefully', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const result = formatDate('invalid-date');

      expect(result === '' || result.includes('Invalid')).toBe(true);

      consoleError.mockRestore();
      consoleWarn.mockRestore();
    });
  });

  describe('formatDeadline', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      const fixedDate = new Date(2024, 0, 15, 12, 0, 0);
      vi.setSystemTime(fixedDate);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return null for no deadline', () => {
      expect(formatDeadline(null)).toBeNull();
      expect(formatDeadline(undefined)).toBeNull();
    });

    it('should mark overdue deadlines', () => {
      const deadline = '2024-01-14';
      const result = formatDeadline(deadline);
      expect(result.isOverdue).toBe(true);
      expect(result.text).toBe('Overdue');
      expect(result.class).toBe('overdue');
    });

    it('should mark today deadlines as urgent', () => {
      const deadline = new Date(2024, 0, 15, 12, 0, 0);
      const result = formatDeadline(deadline);
      expect(result.isUrgent).toBe(true);
      expect(result.text).toBe('Today');
      expect(result.class).toBe('today');
    });

    it('should mark tomorrow deadlines as urgent', () => {
      const deadline = new Date(2024, 0, 16, 12, 0, 0);
      const result = formatDeadline(deadline);
      expect(result.isUrgent).toBe(true);
      expect(result.text).toBe('Tomorrow');
      expect(result.class).toBe('soon');
    });

    it('should format upcoming deadlines within a week', () => {
      const deadline = '2024-01-18';
      const result = formatDeadline(deadline);
      expect(result.isUrgent).toBe(false);
      expect(result.class).toBe('upcoming');
    });

    it('should format normal deadlines beyond a week', () => {
      const deadline = '2024-02-01';
      const result = formatDeadline(deadline);
      expect(result.isUrgent).toBe(false);
      expect(result.class).toBe('normal');
    });
  });

  describe('getDateRange', () => {
    it('should return month range', () => {
      const date = new Date('2024-01-15');
      const result = getDateRange('month', date);
      
      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.endDate).toBeInstanceOf(Date);
      expect(moment(result.startDate).format('YYYY-MM-DD')).toBe('2024-01-01');
      expect(moment(result.endDate).format('YYYY-MM-DD')).toBe('2024-01-31');
    });

    it('should return week range', () => {
      const date = new Date('2024-01-15');
      const result = getDateRange('week', date);
      
      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.endDate).toBeInstanceOf(Date);
    });

    it('should return day range', () => {
      const date = new Date(2024, 0, 15, 12, 0, 0);
      const result = getDateRange('day', date);
      
      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.endDate).toBeInstanceOf(Date);
      expect(moment(result.startDate).format('YYYY-MM-DD')).toBe('2024-01-15');
      expect(moment(result.endDate).format('YYYY-MM-DD')).toBe('2024-01-15');
    });

    it('should default to month range for invalid view', () => {
      const date = new Date('2024-01-15');
      const result = getDateRange('invalid', date);
      
      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.endDate).toBeInstanceOf(Date);
    });
  });

  describe('isToday', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      const fixedDate = new Date(2024, 0, 15, 12, 0, 0);
      vi.setSystemTime(fixedDate);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return true for today', () => {
      const todayDate = new Date(2024, 0, 15, 12, 0, 0);
      expect(isToday(todayDate)).toBe(true);
      expect(isToday('2024-01-15')).toBe(true);
    });

    it('should return false for other dates', () => {
      expect(isToday('2024-01-14')).toBe(false);
      expect(isToday('2024-01-16')).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(isToday(null)).toBe(false);
      expect(isToday(undefined)).toBe(false);
    });
  });
});
