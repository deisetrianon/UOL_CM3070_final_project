import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import session from 'express-session';
import authRouter from '../auth.js';

global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

jest.mock('../../config/index.js', () => ({
  default: {
    clientUrl: 'http://localhost:5173',
    google: {
      clientId: 'test-client-id',
      clientSecret: 'test-secret',
    },
  },
}));

const mockAuthenticate = jest.fn((strategy, options) => {
  return (req, res, next) => {
    if (strategy === 'google' && !options?.failureRedirect) {
      try {
        res.redirect(302, 'https://accounts.google.com/o/oauth2/v2/auth');
      } catch (e) {
        res.status(302).end();
      }
      return;
    }

    if (strategy === 'google' && options?.failureRedirect) {
      req.user = {
        id: 'user-id',
        email: 'test@example.com',
        displayName: 'Test User',
      };

      try {
        next();
      } catch (e) {
        res.status(200).end();
      }
      return;
    }

    try {
      next();
    } catch (e) {
      res.status(200).end();
    }
  };
});

jest.mock('../../config/passport.js', () => {
  const mockPassport = {
    authenticate: mockAuthenticate,
    serializeUser: jest.fn(),
    deserializeUser: jest.fn(),
    use: jest.fn(),
  };
  return {
    __esModule: true,
    default: mockPassport,
  };
});

const app = express();
app.use(session({ secret: 'test-secret', resave: false, saveUninitialized: false }));
app.use(express.json());
app.use((req, res, next) => {
  req.isAuthenticated = jest.fn(() => false);
  req.user = null;
  req.logout = jest.fn((callback) => {
    req.user = null;
    if (callback) {
      setImmediate(() => callback(null));
    }
  });
  req.session = {
    destroy: jest.fn((callback) => {
      if (callback) {
        setImmediate(() => callback(null));
      }
    }),
    save: jest.fn((callback) => {
      if (callback) {
        setImmediate(() => callback(null));
      }
    }),
    touch: jest.fn(),
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: null,
    },
  };
  next();
});
app.use('/api/auth', authRouter);

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/auth/google', () => {
    it('should redirect to Google OAuth when configured', async () => {
      const response = await request(app)
        .get('/api/auth/google');

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('https://accounts.google.com/o/oauth2/v2/auth');
    }, 10000);
  });

  describe('GET /api/auth/user', () => {
    it('should return user when authenticated', async () => {
      const testApp = express();
      testApp.use(session({ secret: 'test-secret', resave: false, saveUninitialized: false }));
      testApp.use(express.json());
      testApp.use((req, res, next) => {
        req.isAuthenticated = jest.fn(() => true);
        req.user = {
          id: 'user-id',
          email: 'test@example.com',
          displayName: 'Test User',
          firstName: 'Test',
          lastName: 'User',
          picture: 'https://example.com/pic.jpg',
        };
        req.logout = jest.fn((callback) => {
          if (callback) callback(null);
        });
        req.session = {
          destroy: jest.fn((callback) => {
            if (callback) callback(null);
          }),
          save: jest.fn((callback) => {
            if (callback) callback(null);
          }),
          touch: jest.fn(),
          cookie: {
            secure: false,
            httpOnly: true,
            maxAge: null,
          },
        };
        next();
      });
      testApp.use('/api/auth', authRouter);

      const response = await request(testApp)
        .get('/api/auth/user')
        .expect(200);

      expect(response.body.isAuthenticated).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should return unauthenticated when not logged in', async () => {
      const response = await request(app)
        .get('/api/auth/user')
        .expect(200);

      expect(response.body.isAuthenticated).toBe(false);
      expect(response.body.user).toBeNull();
    }, 10000);
  });

  describe('GET /api/auth/status', () => {
    it('should return authentication status', async () => {
      const response = await request(app)
        .get('/api/auth/status')
        .expect(200);

      expect(response.body).toHaveProperty('isAuthenticated');
      expect(response.body).toHaveProperty('hasUser');
    }, 10000);
  });

  describe('POST /api/auth/logout', () => {
    it('should logout user', async () => {
      const response = await request(app)
        .post('/api/auth/logout');

      if (response.status !== 200) {
        console.error('Response status:', response.status);
        console.error('Response body:', JSON.stringify(response.body, null, 2));
      }
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logged out successfully');
    }, 10000);
  });
});
