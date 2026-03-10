import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { google } from 'googleapis';
import { CalendarService } from '../calendarService.js';

global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

jest.mock('googleapis');

describe('CalendarService', () => {
  let calendarService;
  let mockCalendar;
  let mockOAuth2Client;

  beforeEach(() => {
    jest.clearAllMocks();

    mockOAuth2Client = {
      setCredentials: jest.fn(),
      refreshAccessToken: jest.fn(),
    };

    mockCalendar = {
      events: {
        list: jest.fn(),
      },
    };

    google.auth.OAuth2 = jest.fn().mockImplementation(() => mockOAuth2Client);
    google.calendar = jest.fn().mockReturnValue(mockCalendar);

    calendarService = new CalendarService();
  });

  describe('setCredentials', () => {
    it('should set credentials', () => {
      calendarService.setCredentials('access-token', 'refresh-token');
      expect(mockOAuth2Client.setCredentials).toHaveBeenCalledWith({
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      });
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh access token', async () => {
      mockOAuth2Client.refreshAccessToken.mockResolvedValue({
        credentials: { access_token: 'new-access-token' },
      });

      const result = await calendarService.refreshAccessToken('refresh-token');

      expect(result).toBe('new-access-token');
      expect(mockOAuth2Client.refreshAccessToken).toHaveBeenCalled();
    });
  });

  describe('getEvents', () => {
    it('should fetch events successfully', async () => {
      const mockEvents = [
        {
          id: 'event1',
          summary: 'Meeting',
          start: { dateTime: '2024-01-15T10:00:00Z' },
          end: { dateTime: '2024-01-15T11:00:00Z' },
        },
      ];

      mockCalendar.events.list.mockResolvedValue({
        data: {
          items: mockEvents,
          timeZone: 'America/New_York',
        },
      });

      const result = await calendarService.getEvents('access-token', 'refresh-token', {
        timeMin: '2024-01-15T00:00:00Z',
        timeMax: '2024-01-16T00:00:00Z',
      });

      expect(result.events).toHaveLength(1);
      expect(result.timeZone).toBe('America/New_York');
      expect(mockCalendar.events.list).toHaveBeenCalled();
    });

    it('should handle empty events list', async () => {
      mockCalendar.events.list.mockResolvedValue({
        data: {
          items: null,
          timeZone: 'UTC',
        },
      });

      const result = await calendarService.getEvents('access-token', 'refresh-token');

      expect(result.events).toEqual([]);
      expect(result.nextPageToken).toBeNull();
    });

    it('should refresh token on 401 error', async () => {
      const error = new Error('Unauthorized');
      error.code = 401;
      error.response = { status: 401 };

      mockCalendar.events.list
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce({
          data: { items: [], timeZone: 'UTC' },
        });

      mockOAuth2Client.refreshAccessToken.mockResolvedValue({
        credentials: { access_token: 'new-token' },
      });

      const result = await calendarService.getEvents('access-token', 'refresh-token');

      expect(mockOAuth2Client.refreshAccessToken).toHaveBeenCalled();
      expect(result.events).toEqual([]);
    });
  });

  describe('parseEvent', () => {
    it('should parse event with dateTime', () => {
      const event = {
        id: 'event1',
        summary: 'Meeting',
        start: { dateTime: '2024-01-15T10:00:00Z' },
        end: { dateTime: '2024-01-15T11:00:00Z' },
        location: 'Office',
      };

      const parsed = calendarService.parseEvent(event);

      expect(parsed.id).toBe('event1');
      expect(parsed.title).toBe('Meeting');
      expect(parsed.start).toBeInstanceOf(Date);
      expect(parsed.end).toBeInstanceOf(Date);
      expect(parsed.start.toISOString()).toBe('2024-01-15T10:00:00.000Z');
      expect(parsed.end.toISOString()).toBe('2024-01-15T11:00:00.000Z');
    });

    it('should parse event with date (all-day)', () => {
      const event = {
        id: 'event2',
        summary: 'All Day Event',
        start: { date: '2024-01-15' },
        end: { date: '2024-01-16' },
      };

      const parsed = calendarService.parseEvent(event);

      expect(parsed.start).toBeInstanceOf(Date);
      expect(parsed.end).toBeInstanceOf(Date);
      expect(parsed.start.toISOString().split('T')[0]).toBe('2024-01-15');
      expect(parsed.end.toISOString().split('T')[0]).toBe('2024-01-16');
      expect(parsed.isAllDay).toBe(true);
    });

    it('should detect Google Meet links', () => {
      const event = {
        id: 'event3',
        summary: 'Video Call',
        start: { dateTime: '2024-01-15T10:00:00Z' },
        end: { dateTime: '2024-01-15T11:00:00Z' },
        hangoutLink: 'https://meet.google.com/abc-defg-hij',
      };

      const parsed = calendarService.parseEvent(event);

      expect(parsed.isGoogleMeet).toBe(true);
      expect(parsed.meetLink).toBe('https://meet.google.com/abc-defg-hij');
    });
  });
});
