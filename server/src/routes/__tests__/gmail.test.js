import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import gmailRouter from '../gmail.js';
import gmailService from '../../services/gmailService.js';

global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

const mockGmailService = {
  getEmails: jest.fn(),
  getEmail: jest.fn(),
  getProfile: jest.fn(),
  getLabels: jest.fn(),
  markAsRead: jest.fn(),
  toggleStar: jest.fn(),
  sendEmail: jest.fn(),
  replyToEmail: jest.fn(),
  deleteEmail: jest.fn(),
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

jest.mock('../../services/gmailService.js', () => {
  const mockService = {
    getEmails: jest.fn(),
    getEmail: jest.fn(),
    getProfile: jest.fn(),
    getLabels: jest.fn(),
    markAsRead: jest.fn(),
    toggleStar: jest.fn(),
    sendEmail: jest.fn(),
    replyToEmail: jest.fn(),
    deleteEmail: jest.fn(),
  };
  
  return {
    __esModule: true,
    default: mockService,
  };
});

jest.mock('../../utils/response.js', async () => {
  const actual = await jest.requireActual('../../utils/response.js');
  return {
    ...actual,
    requireAuth: mockRequireAuth,
  };
});

if (gmailService && typeof gmailService === 'object') {
  Object.keys(mockGmailService).forEach(key => {
    if (typeof mockGmailService[key] === 'function') {
      gmailService[key] = mockGmailService[key];
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
app.use('/api/gmail', gmailRouter);

describe('Gmail Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGmailService.getEmails.mockResolvedValue({ emails: [], nextPageToken: null, resultSizeEstimate: 0 });
    mockGmailService.getEmail.mockResolvedValue({ id: '', subject: '', body: '' });
    mockGmailService.getProfile.mockResolvedValue({ emailAddress: '' });
    mockGmailService.getLabels.mockResolvedValue({ labels: [] });
    mockGmailService.markAsRead.mockResolvedValue(true);
    mockGmailService.toggleStar.mockResolvedValue({ id: '', isStarred: false, labelIds: [] });
    mockGmailService.sendEmail.mockResolvedValue({ id: '' });
    mockGmailService.replyToEmail.mockResolvedValue({ id: '' });
    mockGmailService.deleteEmail.mockResolvedValue({ id: '' });
  });

  describe('GET /api/gmail/emails', () => {
    it('should fetch emails successfully', async () => {
      const mockResult = {
        emails: [{ id: '1', subject: 'Test' }],
        nextPageToken: 'token',
        resultSizeEstimate: 100,
      };

      mockGmailService.getEmails.mockResolvedValueOnce(mockResult);

      const response = await request(app)
        .get('/api/gmail/emails?label=INBOX&maxResults=20');

      if (response.status !== 200) {
        console.error('Response status:', response.status);
        console.error('Response body:', JSON.stringify(response.body, null, 2));
        console.error('Response text:', response.text);
        console.error('Mock called:', mockGmailService.getEmails.mock.calls.length);
      }
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.emails).toEqual(mockResult.emails);
      expect(mockGmailService.getEmails).toHaveBeenCalled();
    });

    it('should handle token expiration', async () => {
      const error = new Error('TOKEN_EXPIRED');
      mockGmailService.getEmails.mockRejectedValue(error);

      const response = await request(app)
        .get('/api/gmail/emails')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('UNAUTHORIZED');
    });
  });

  describe('GET /api/gmail/emails/:id', () => {
    it('should fetch email by id', async () => {
      const mockEmail = { id: 'email-id', subject: 'Test', body: 'Content' };
      mockGmailService.getEmail.mockResolvedValue(mockEmail);

      const response = await request(app)
        .get('/api/gmail/emails/email-id');

      if (response.status !== 200) {
        console.error('Response status:', response.status);
        console.error('Response body:', JSON.stringify(response.body, null, 2));
        console.error('Response text:', response.text);
      }
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.email).toEqual(mockEmail);
    });
  });

  describe('GET /api/gmail/labels', () => {
    it('should fetch labels', async () => {
      const mockLabels = [
        { id: 'INBOX', name: 'Inbox' },
        { id: 'STARRED', name: 'Starred' },
      ];

      mockGmailService.getLabels.mockResolvedValue({ labels: mockLabels });

      const response = await request(app)
        .get('/api/gmail/labels')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.labels).toBeDefined();
    });
  });

  describe('POST /api/gmail/emails/:id/mark-read', () => {
    it('should mark email as read', async () => {
      mockGmailService.markAsRead.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/gmail/emails/email-id/mark-read')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/gmail/emails/:id/toggle-star', () => {
    it('should toggle star status', async () => {
      const mockEmail = { id: 'email-id', isStarred: true, labelIds: ['STARRED'] };
      mockGmailService.toggleStar.mockResolvedValue(mockEmail);

      const response = await request(app)
        .post('/api/gmail/emails/email-id/toggle-star')
        .send({ isStarred: false })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockGmailService.toggleStar).toHaveBeenCalledWith(
        'access-token',
        'refresh-token',
        'email-id',
        false
      );
    });
  });

  describe('POST /api/gmail/emails/send', () => {
    it('should send email', async () => {
      mockGmailService.sendEmail.mockResolvedValue({ id: 'sent-id' });

      const emailData = {
        to: 'recipient@example.com',
        subject: 'Test',
        body: 'Test body',
      };

      const response = await request(app)
        .post('/api/gmail/emails/send')
        .send(emailData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockGmailService.sendEmail).toHaveBeenCalledWith(
        'access-token',
        'refresh-token',
        expect.objectContaining(emailData)
      );
    });
  });
});
