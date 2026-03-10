import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import settingsRouter from '../settings.js';
import User from '../../models/User.js';

global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

jest.mock('../../models/User.js');

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  req.isAuthenticated = jest.fn(() => true);
  req.user = { id: 'user-id' };
  next();
});
app.use('/api/settings', settingsRouter);

describe('Settings Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/settings', () => {
    it('should fetch user settings', async () => {
      const mockUser = {
        _id: 'user-id',
        preferences: {
          notifications: { email: true, stressAlerts: true },
          facialAnalysis: { enabled: true, frequency: 5 },
          zenMode: { autoEnabled: true },
        },
      };

      User.findById = jest.fn().mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/settings')
        .set('Cookie', 'connect.sid=test-session')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.settings).toBeDefined();
      expect(response.body.settings.notifications.email).toBe(true);
    });

    it('should return default settings if user has none', async () => {
      const mockUser = {
        _id: 'user-id',
        preferences: null,
      };

      User.findById = jest.fn().mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/settings')
        .set('Cookie', 'connect.sid=test-session')
        .expect(200);

      expect(response.body.settings.zenMode.autoEnabled).toBe(true);
    });
  });

  describe('PUT /api/settings', () => {
    it('should update user settings', async () => {
      const mockUser = {
        _id: 'user-id',
        preferences: {},
        save: jest.fn().mockResolvedValue(true),
      };

      User.findById = jest.fn().mockResolvedValue(mockUser);

      const response = await request(app)
        .put('/api/settings')
        .set('Cookie', 'connect.sid=test-session')
        .send({
          zenMode: { autoEnabled: false },
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockUser.save).toHaveBeenCalled();
    });
  });

  describe('PATCH /api/settings/zen-mode', () => {
    it('should update Zen Mode preference', async () => {
      const mockUser = {
        _id: 'user-id',
        preferences: {},
        save: jest.fn().mockResolvedValue(true),
      };

      User.findById = jest.fn().mockResolvedValue(mockUser);

      const response = await request(app)
        .patch('/api/settings/zen-mode')
        .set('Cookie', 'connect.sid=test-session')
        .send({ autoEnabled: false })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
