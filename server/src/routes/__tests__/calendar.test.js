import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import calendarRouter from '../calendar.js';
import calendarService from '../../services/calendarService.js';

global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

const mockCalendarService = {
  getEvents: jest.fn(),
  getAllEvents: jest.fn(),
  getCalendarList: jest.fn(),
};

const mockRequireAuth = jest.fn((req, res, next) => {
  req.isAuthenticated = jest.fn(() => true);
  req.user = {
    id: 'test-user-id',
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
  };
  next();
});

const mockTask = {
  find: jest.fn().mockReturnValue({
    sort: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue([]),
    }),
  }),
};

jest.mock('../../services/calendarService.js', () => {
  const mockService = {
    getEvents: jest.fn(),
    getAllEvents: jest.fn(),
    getCalendarList: jest.fn(),
  };
  return {
    __esModule: true,
    default: mockService,
  };
});

jest.mock('../../models/Task.js', () => ({
  __esModule: true,
  default: mockTask,
}));

jest.mock('../../models/User.js', () => ({
  __esModule: true,
  default: {
    findByIdAndUpdate: jest.fn().mockResolvedValue({}),
  },
}));

jest.mock('../../utils/response.js', async () => {
  const actual = await jest.requireActual('../../utils/response.js');
  return {
    ...actual,
    requireAuth: mockRequireAuth,
  };
});

if (calendarService && typeof calendarService === 'object') {
  Object.keys(mockCalendarService).forEach(key => {
    if (typeof mockCalendarService[key] === 'function') {
      calendarService[key] = mockCalendarService[key];
    }
  });
}

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  req.isAuthenticated = jest.fn(() => true);
  req.user = {
    id: 'test-user-id',
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
  };
  next();
});
app.use('/api/calendar', calendarRouter);

describe('Calendar Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTask.find.mockClear();
    mockCalendarService.getEvents.mockResolvedValue({ events: [], timeZone: 'UTC' });
    mockCalendarService.getAllEvents.mockResolvedValue({ events: [], timeZone: 'UTC' });
    mockCalendarService.getCalendarList.mockResolvedValue({ items: [] });
    
    if (calendarService && typeof calendarService === 'object') {
      Object.keys(mockCalendarService).forEach(key => {
        if (typeof mockCalendarService[key] === 'function') {
          calendarService[key] = mockCalendarService[key];
        }
      });
    }
  });

  describe('GET /api/calendar/events', () => {
    it('should fetch calendar events', async () => {
      const mockEvents = [
        {
          id: 'event1',
          title: 'Meeting',
          start: '2024-01-15T10:00:00Z',
          end: '2024-01-15T11:00:00Z',
        },
      ];

      mockCalendarService.getEvents.mockResolvedValue({
        events: mockEvents,
        timeZone: 'UTC',
      });

      const response = await request(app)
        .get('/api/calendar/events?timeMin=2024-01-15T00:00:00Z')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.events).toEqual(mockEvents);
    });

    it('should handle token expiration', async () => {
      const error = new Error('TOKEN_EXPIRED');
      mockCalendarService.getEvents.mockRejectedValue(error);

      const response = await request(app)
        .get('/api/calendar/events');

      if (response.status !== 401) {
        console.error('Response status:', response.status);
        console.error('Response body:', JSON.stringify(response.body, null, 2));
      }
      
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/calendar/combined', () => {
    it('should return combined calendar and task events', async () => {
      const mockCalendarEvents = [
        { id: 'cal1', title: 'Meeting', start: '2024-01-15T10:00:00Z' },
      ];

      const mockTasks = [
        {
          _id: 'task1',
          title: 'Task',
          deadline: new Date('2024-01-15T12:00:00Z'),
          status: 'todo',
          toClientJSON: () => ({
            id: 'task1',
            title: 'Task',
            deadline: '2024-01-15T12:00:00Z',
            status: 'todo',
          }),
        },
      ];

      mockCalendarService.getAllEvents.mockResolvedValue({
        events: mockCalendarEvents,
        timeZone: 'UTC',
      });

      mockTask.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockTasks),
        }),
      });

      const response = await request(app)
        .get('/api/calendar/combined?timeMin=2024-01-15T00:00:00Z&timeMax=2024-01-16T00:00:00Z')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.events).toBeDefined();
    });
  });
});
