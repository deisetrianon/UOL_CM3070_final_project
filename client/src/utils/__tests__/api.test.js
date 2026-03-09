import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  apiRequest,
  apiGet,
  apiPost,
  apiPatch,
  apiPut,
  apiDelete,
  getErrorMessage,
} from '../api.js';

describe('API Utilities', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    vi.clearAllMocks();
  });

  describe('apiRequest', () => {
    it('should make successful request', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ success: true, data: 'test' }),
      };

      global.fetch.mockResolvedValue(mockResponse);

      const result = await apiRequest('/api/test');

      expect(result).toEqual({ success: true, data: 'test' });
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          credentials: 'include',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should handle request errors', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        json: async () => ({ message: 'Bad Request' }),
      };

      global.fetch.mockResolvedValue(mockResponse);

      await expect(apiRequest('/api/test')).rejects.toThrow('Bad Request');
    });

    it('should handle network errors', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      await expect(apiRequest('/api/test')).rejects.toThrow('Network error');
    });

    it('should merge custom headers', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({}),
      };

      global.fetch.mockResolvedValue(mockResponse);

      await apiRequest('/api/test', {
        headers: { 'X-Custom-Header': 'value' },
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Custom-Header': 'value',
          }),
        })
      );
    });
  });

  describe('apiGet', () => {
    it('should make GET request with query parameters', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({}),
      };

      global.fetch.mockResolvedValue(mockResponse);

      await apiGet('/api/test', { param1: 'value1', param2: 'value2' });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test?param1=value1&param2=value2',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should make GET request without parameters', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({}),
      };

      global.fetch.mockResolvedValue(mockResponse);

      await apiGet('/api/test');

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  describe('apiPost', () => {
    it('should make POST request with body', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({}),
      };

      global.fetch.mockResolvedValue(mockResponse);

      await apiPost('/api/test', { key: 'value' });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ key: 'value' }),
        })
      );
    });
  });

  describe('apiPatch', () => {
    it('should make PATCH request with body', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({}),
      };

      global.fetch.mockResolvedValue(mockResponse);

      await apiPatch('/api/test', { key: 'value' });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ key: 'value' }),
        })
      );
    });
  });

  describe('apiPut', () => {
    it('should make PUT request with body', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({}),
      };

      global.fetch.mockResolvedValue(mockResponse);

      await apiPut('/api/test', { key: 'value' });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ key: 'value' }),
        })
      );
    });
  });

  describe('apiDelete', () => {
    it('should make DELETE request', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({}),
      };

      global.fetch.mockResolvedValue(mockResponse);

      await apiDelete('/api/test');

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('getErrorMessage', () => {
    it('should return error message from Error object', () => {
      const error = new Error('Test error');
      expect(getErrorMessage(error)).toBe('Test error');
    });

    it('should return message from response data', () => {
      const error = {
        response: {
          data: { message: 'Response error' },
        },
      };
      expect(getErrorMessage(error)).toBe('Response error');
    });

    it('should return default message for unknown error', () => {
      const error = {};
      expect(getErrorMessage(error)).toBe('An unexpected error occurred. Please try again.');
    });
  });
});
