import { describe, it, expect } from 'vitest';
import moment from 'moment';
import {
  getEventColorStyle,
  eventOccursOnCalendarDay,
  getEventLayoutRange,
} from '../calendarUtils';

describe('calendarUtils', () => {
  describe('getEventColorStyle', () => {
    it('should return urgent task style', () => {
      const event = {
        resource: {
          type: 'task',
          taskIsUrgent: true,
        },
      };

      const style = getEventColorStyle(event);

      expect(style.backgroundColor).toContain('234, 67, 53');
      expect(style.borderLeftColor).toBe('#ea4335');
    });

    it('should return high priority task style', () => {
      const event = {
        resource: {
          type: 'task',
          taskPriority: 'high',
        },
      };

      const style = getEventColorStyle(event);

      expect(style.backgroundColor).toContain('251, 188, 4');
      expect(style.borderLeftColor).toBe('#fbbc04');
    });

    it('should return medium priority task style', () => {
      const event = {
        resource: {
          type: 'task',
          taskPriority: 'medium',
        },
      };

      const style = getEventColorStyle(event);

      expect(style.backgroundColor).toContain('66, 133, 244');
      expect(style.borderLeftColor).toBe('#4285f4');
    });

    it('should return Google Meet style', () => {
      const event = {
        resource: {
          isGoogleMeet: true,
        },
      };

      const style = getEventColorStyle(event);

      expect(style.backgroundColor).toContain('52, 168, 83');
      expect(style.borderLeftColor).toBe('#34a853');
    });

    it('should return calendar color style', () => {
      const event = {
        resource: {
          calendarColor: '#ff0000',
        },
      };

      const style = getEventColorStyle(event);

      expect(style.backgroundColor).toContain('255, 0, 0');
      expect(style.borderLeftColor).toBe('#ff0000');
    });

    it('should return default style for regular events', () => {
      const event = {};

      const style = getEventColorStyle(event);

      expect(style.backgroundColor).toContain('66, 133, 244');
      expect(style.borderLeftColor).toBe('#4285f4');
    });
  });

  describe('eventOccursOnCalendarDay', () => {
    it('should match task by UTC deadlineDate to local calendar column', () => {
      const day = moment('2026-03-24');
      const event = {
        start: new Date('2026-03-24T00:00:00.000Z'),
        resource: { type: 'task', deadlineDate: '2026-03-24' },
      };
      expect(eventOccursOnCalendarDay(event, day)).toBe(true);
    });

    it('should not place UTC-midnight task on previous local day', () => {
      const day = moment('2026-03-23');
      const event = {
        start: new Date('2026-03-24T00:00:00.000Z'),
        resource: { type: 'task', deadlineDate: '2026-03-24' },
      };
      expect(eventOccursOnCalendarDay(event, day)).toBe(false);
    });
  });

  describe('getEventLayoutRange', () => {
    it('should anchor tasks at 6:00 local (first grid slot) on the column day', () => {
      const day = moment('2026-03-24').hour(0).minute(0);
      const event = {
        start: new Date('2026-03-24T00:00:00.000Z'),
        end: new Date('2026-03-24T01:00:00.000Z'),
        resource: { type: 'task', deadlineDate: '2026-03-24' },
      };
      const { start, end } = getEventLayoutRange(event, day);
      expect(start.hour()).toBe(6);
      expect(end.diff(start, 'minutes')).toBe(60);
    });
  });
});
