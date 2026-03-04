import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest, getErrorMessage } from '../utils/api';

export function useApi() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(async (endpoint, options = {}) => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiRequest(endpoint, options);
      return data;
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      
      if (err.message?.includes('401') || err.message?.includes('Not authenticated')) {
        navigate('/login');
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const get = useCallback(async (endpoint, params = {}) => {
    return request(endpoint, { method: 'GET', params });
  }, [request]);

  const post = useCallback(async (endpoint, body = {}) => {
    return request(endpoint, { method: 'POST', body });
  }, [request]);

  const patch = useCallback(async (endpoint, body = {}) => {
    return request(endpoint, { method: 'PATCH', body });
  }, [request]);

  const del = useCallback(async (endpoint) => {
    return request(endpoint, { method: 'DELETE' });
  }, [request]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    request,
    get,
    post,
    patch,
    delete: del,
    clearError,
  };
}
