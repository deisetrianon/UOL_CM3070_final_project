import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useApi } from '../useApi';
import * as apiUtils from '../../utils/api';

const mockNavigate = vi.fn();

vi.mock('../../utils/api');

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

import { BrowserRouter } from 'react-router-dom';

const wrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>;

describe('useApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useApi(), { wrapper });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should make successful request', async () => {
    const mockData = { success: true, data: 'test' };
    apiUtils.apiRequest = vi.fn().mockResolvedValue(mockData);

    const { result } = renderHook(() => useApi(), { wrapper });

    const response = await result.current.request('/api/test');

    expect(response).toEqual(mockData);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle request errors', async () => {
    const error = new Error('Request failed');
    apiUtils.apiRequest = vi.fn().mockRejectedValue(error);
    apiUtils.getErrorMessage = vi.fn().mockReturnValue('Request failed');

    const { result } = renderHook(() => useApi(), { wrapper });

    await expect(result.current.request('/api/test')).rejects.toThrow();

    await waitFor(() => {
      expect(result.current.error).toBe('Request failed');
      expect(result.current.loading).toBe(false);
    });
  });

  it('should redirect on 401 error', async () => {
    const error = new Error('401 Unauthorized');
    apiUtils.apiRequest = vi.fn().mockRejectedValue(error);
    apiUtils.getErrorMessage = vi.fn().mockReturnValue('401 Unauthorized');

    const { result } = renderHook(() => useApi(), { wrapper });

    await expect(result.current.request('/api/test')).rejects.toThrow();
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('should provide get method', async () => {
    const mockData = { success: true };
    apiUtils.apiRequest = vi.fn().mockResolvedValue(mockData);

    const { result } = renderHook(() => useApi(), { wrapper });

    const response = await result.current.get('/api/test', { param: 'value' });

    expect(response).toEqual(mockData);
  });

  it('should provide post method', async () => {
    const mockData = { success: true };
    apiUtils.apiRequest = vi.fn().mockResolvedValue(mockData);

    const { result } = renderHook(() => useApi(), { wrapper });

    const response = await result.current.post('/api/test', { key: 'value' });

    expect(response).toEqual(mockData);
  });

  it('should provide patch method', async () => {
    const mockData = { success: true };
    apiUtils.apiRequest = vi.fn().mockResolvedValue(mockData);

    const { result } = renderHook(() => useApi(), { wrapper });

    const response = await result.current.patch('/api/test', { key: 'value' });

    expect(response).toEqual(mockData);
  });

  it('should provide delete method', async () => {
    const mockData = { success: true };
    apiUtils.apiRequest = vi.fn().mockResolvedValue(mockData);

    const { result } = renderHook(() => useApi(), { wrapper });

    const response = await result.current.delete('/api/test');

    expect(response).toEqual(mockData);
  });

  it('should clear error', () => {
    const { result } = renderHook(() => useApi(), { wrapper });

    result.current.clearError();

    expect(result.current.error).toBeNull();
  });
});
