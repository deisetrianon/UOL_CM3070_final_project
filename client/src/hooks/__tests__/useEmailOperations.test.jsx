import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { useEmailOperations } from '../useEmailOperations';
import * as apiUtils from '../../utils/api';
import { API_ENDPOINTS } from '../../constants';

vi.mock('../../utils/api');
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    BrowserRouter: actual.BrowserRouter,
    useNavigate: () => vi.fn(),
  };
});

const wrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>;

describe('useEmailOperations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useEmailOperations(), { wrapper });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.EMAILS_PER_PAGE).toBe(20);
  });

  describe('fetchEmails', () => {
    it('should fetch emails successfully', async () => {
      const mockData = {
        success: true,
        emails: [{ id: '1', subject: 'Test' }],
        nextPageToken: 'token',
        resultSizeEstimate: 100,
      };

      apiUtils.apiGet = vi.fn().mockResolvedValue(mockData);

      const { result } = renderHook(() => useEmailOperations(), { wrapper });

      const response = await result.current.fetchEmails('INBOX');

      expect(response.emails).toEqual(mockData.emails);
      expect(response.nextPageToken).toBe('token');
      expect(result.current.loading).toBe(false);
    });

    it('should handle fetch errors', async () => {
      const error = new Error('Failed to fetch');
      apiUtils.apiGet = vi.fn().mockRejectedValue(error);
      apiUtils.getErrorMessage = vi.fn().mockReturnValue('Failed to fetch');

      const { result } = renderHook(() => useEmailOperations(), { wrapper });

      await expect(result.current.fetchEmails('INBOX')).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to fetch');
      });
    });

    it('should include query parameter', async () => {
      const mockData = { success: true, emails: [] };
      apiUtils.apiGet = vi.fn().mockResolvedValue(mockData);

      const { result } = renderHook(() => useEmailOperations(), { wrapper });

      await result.current.fetchEmails('INBOX', null, 'test query');

      expect(apiUtils.apiGet).toHaveBeenCalledWith(
        API_ENDPOINTS.EMAIL.LIST,
        expect.objectContaining({ query: 'test query' })
      );
    });
  });

  describe('fetchFullEmail', () => {
    it('should fetch full email content', async () => {
      const mockData = {
        success: true,
        email: { id: '1', body: 'Full content' },
      };

      apiUtils.apiGet = vi.fn().mockResolvedValue(mockData);

      const { result } = renderHook(() => useEmailOperations(), { wrapper });

      const email = await result.current.fetchFullEmail('email-id');

      expect(email).toEqual(mockData.email);
    });
  });

  describe('deleteEmail', () => {
    it('should delete email successfully', async () => {
      const mockData = { success: true };
      apiUtils.apiDelete = vi.fn().mockResolvedValue(mockData);

      const { result } = renderHook(() => useEmailOperations(), { wrapper });

      const success = await result.current.deleteEmail('email-id');

      expect(success).toBe(true);
      expect(apiUtils.apiDelete).toHaveBeenCalledWith(
        API_ENDPOINTS.EMAIL.GET('email-id')
      );
    });
  });

  describe('markEmailAsRead', () => {
    it('should mark email as read', async () => {
      const mockData = { success: true };
      apiUtils.apiPost = vi.fn().mockResolvedValue(mockData);

      const { result } = renderHook(() => useEmailOperations(), { wrapper });

      const success = await result.current.markEmailAsRead('email-id');

      expect(success).toBe(true);
    });
  });

  describe('toggleStar', () => {
    it('should toggle star status', async () => {
      const mockData = {
        success: true,
        email: { isStarred: true, labelIds: ['STARRED'] },
      };

      apiUtils.apiPost = vi.fn().mockResolvedValue(mockData);

      const { result } = renderHook(() => useEmailOperations(), { wrapper });

      const response = await result.current.toggleStar('email-id', false);

      expect(response.isStarred).toBe(true);
      expect(response.labelIds).toEqual(['STARRED']);
    });
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      const mockData = { success: true };
      apiUtils.apiPost = vi.fn().mockResolvedValue(mockData);

      const { result } = renderHook(() => useEmailOperations(), { wrapper });

      const success = await result.current.sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        body: 'Body',
      });

      expect(success).toBe(true);
      expect(apiUtils.apiPost).toHaveBeenCalledWith(
        API_ENDPOINTS.EMAIL.SEND,
        expect.objectContaining({ to: 'test@example.com' })
      );
    });
  });

  describe('replyToEmail', () => {
    it('should send reply', async () => {
      const mockData = { success: true };
      apiUtils.apiPost = vi.fn().mockResolvedValue(mockData);

      const { result } = renderHook(() => useEmailOperations(), { wrapper });

      const success = await result.current.replyToEmail('email-id', 'Reply body');

      expect(success).toBe(true);
    });

    it('should send reply all when specified', async () => {
      const mockData = { success: true };
      apiUtils.apiPost = vi.fn().mockResolvedValue(mockData);

      const { result } = renderHook(() => useEmailOperations(), { wrapper });

      await result.current.replyToEmail('email-id', 'Reply body', true);

      expect(apiUtils.apiPost).toHaveBeenCalledWith(
        expect.stringContaining('/reply'),
        expect.objectContaining({ replyAll: true })
      );
    });
  });
});
