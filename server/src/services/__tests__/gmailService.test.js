import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { google } from 'googleapis';
import { GmailService } from '../gmailService.js';

global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

jest.mock('googleapis');

describe('GmailService', () => {
  let gmailService;
  let mockGmail;
  let mockOAuth2Client;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockOAuth2Client = {
      setCredentials: jest.fn(),
    };

    mockGmail = {
      users: {
        messages: {
          list: jest.fn(),
          get: jest.fn(),
          modify: jest.fn(),
          send: jest.fn(),
          trash: jest.fn(),
          batchModify: jest.fn(),
        },
        labels: {
          list: jest.fn(),
        },
        getProfile: jest.fn(),
      },
    };

    google.auth.OAuth2 = jest.fn().mockImplementation(() => mockOAuth2Client);
    google.gmail = jest.fn().mockReturnValue(mockGmail);

    gmailService = new GmailService();
  });

  describe('setCredentials', () => {
    it('should set credentials with access token', () => {
      gmailService.setCredentials('access-token');
      expect(mockOAuth2Client.setCredentials).toHaveBeenCalledWith({
        access_token: 'access-token',
      });
    });

    it('should set credentials with access and refresh token', () => {
      gmailService.setCredentials('access-token', 'refresh-token');
      expect(mockOAuth2Client.setCredentials).toHaveBeenCalledWith({
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      });
    });
  });

  describe('getEmails', () => {
    it('should fetch emails successfully', async () => {
      const mockMessages = [
        { id: 'msg1' },
        { id: 'msg2' },
      ];

      const mockMessageData = {
        id: 'msg1',
        payload: {
          headers: [
            { name: 'From', value: 'sender@example.com' },
            { name: 'Subject', value: 'Test Subject' },
            { name: 'Date', value: 'Mon, 1 Jan 2024 12:00:00 +0000' },
          ],
        },
        snippet: 'Email snippet',
        labelIds: ['INBOX', 'UNREAD'],
      };

      mockGmail.users.messages.list.mockResolvedValue({
        data: {
          messages: mockMessages,
          nextPageToken: 'next-token',
          resultSizeEstimate: 100,
        },
      });

      mockGmail.users.messages.get.mockResolvedValue({
        data: mockMessageData,
      });

      const result = await gmailService.getEmails('access-token', 'refresh-token', {
        maxResults: 20,
        labelIds: ['INBOX'],
      });

      expect(result.emails).toHaveLength(2);
      expect(result.nextPageToken).toBe('next-token');
      expect(result.resultSizeEstimate).toBe(100);
    });

    it('should handle empty email list', async () => {
      mockGmail.users.messages.list.mockResolvedValue({
        data: {
          messages: null,
        },
      });

      const result = await gmailService.getEmails('access-token', 'refresh-token');

      expect(result.emails).toEqual([]);
      expect(result.nextPageToken).toBeNull();
    });

    it('should handle token expiration', async () => {
      const error = new Error('invalid_grant');
      error.code = 401;
      mockGmail.users.messages.list.mockRejectedValue(error);

      await expect(
        gmailService.getEmails('expired-token', 'refresh-token')
      ).rejects.toThrow('TOKEN_EXPIRED');
    });

    it('should include query parameter when provided', async () => {
      mockGmail.users.messages.list.mockResolvedValue({
        data: { messages: [] },
      });

      await gmailService.getEmails('access-token', 'refresh-token', {
        query: 'from:test@example.com',
      });

      expect(mockGmail.users.messages.list).toHaveBeenCalledWith(
        expect.objectContaining({
          q: 'from:test@example.com',
        })
      );
    });
  });

  describe('getEmail', () => {
    it('should fetch full email content', async () => {
      const mockEmailData = {
        id: 'msg1',
        payload: {
          body: { data: 'base64data' },
          parts: [],
        },
      };

      mockGmail.users.messages.get.mockResolvedValue({
        data: mockEmailData,
      });

      const result = await gmailService.getEmail('access-token', 'refresh-token', 'msg1');

      expect(result).toBeDefined();
      expect(mockGmail.users.messages.get).toHaveBeenCalledWith({
        userId: 'me',
        id: 'msg1',
        format: 'full',
      });
    });
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      const emailData = {
        to: 'recipient@example.com',
        subject: 'Test',
        body: 'Test body',
      };

      mockGmail.users.getProfile.mockResolvedValue({
        data: { emailAddress: 'sender@example.com' },
      });
      mockGmail.users.messages.send.mockResolvedValue({
        data: { id: 'sent-msg-id' },
      });

      const result = await gmailService.sendEmail('access-token', 'refresh-token', emailData);

      expect(result).toBeDefined();
      expect(mockGmail.users.messages.send).toHaveBeenCalled();
    });
  });

  describe('toggleStar', () => {
    it('should toggle star status', async () => {
      mockGmail.users.messages.modify.mockResolvedValue({
        data: { id: 'msg1', labelIds: ['STARRED'] },
      });

      const result = await gmailService.toggleStar('access-token', 'refresh-token', 'msg1', true);

      expect(result).toBeDefined();
      expect(mockGmail.users.messages.modify).toHaveBeenCalled();
    });
  });

  describe('deleteEmail', () => {
    it('should delete email', async () => {
      mockGmail.users.messages.trash.mockResolvedValue({
        data: { id: 'msg1', labelIds: [], threadId: 'thread1' },
      });

      const result = await gmailService.deleteEmail('access-token', 'refresh-token', 'msg1');

      expect(result).toBeDefined();
      expect(result.id).toBe('msg1');
      expect(mockGmail.users.messages.trash).toHaveBeenCalledWith({
        userId: 'me',
        id: 'msg1',
      });
    });
  });

  describe('getLabels', () => {
    it('should fetch labels', async () => {
      const mockLabels = [
        { id: 'INBOX', name: 'INBOX' },
        { id: 'STARRED', name: 'STARRED' },
      ];

      mockGmail.users.labels.list.mockResolvedValue({
        data: { labels: mockLabels },
      });

      const result = await gmailService.getLabels('access-token', 'refresh-token');

      expect(result).toHaveProperty('labels');
      expect(result.labels).toHaveLength(2);
      expect(mockGmail.users.labels.list).toHaveBeenCalledWith({
        userId: 'me',
      });
    });
  });
});
