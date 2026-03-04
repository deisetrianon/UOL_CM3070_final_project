import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../constants';
import { apiGet, apiPost, apiDelete, getErrorMessage } from '../utils/api';

const EMAILS_PER_PAGE = 20;

export function useEmailOperations() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchEmails = useCallback(async (label = 'INBOX', pageToken = null, query = '') => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        label,
        maxResults: EMAILS_PER_PAGE,
        ...(pageToken && { pageToken }),
        ...(query && { query }),
      };

      const data = await apiGet(API_ENDPOINTS.EMAIL.LIST, params);

      if (data.success) {
        return {
          emails: data.emails || [],
          nextPageToken: data.nextPageToken || null,
          totalEstimate: data.resultSizeEstimate || 0,
        };
      } else {
        throw new Error(data.error || 'Failed to fetch emails');
      }
    } catch (err) {
      console.error('Error fetching emails:', err);
      if (err.message?.includes('401') || err.message?.includes('Not authenticated')) {
        navigate('/login');
      }
      setError(getErrorMessage(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const fetchFullEmail = useCallback(async (emailId) => {
    try {
      setLoading(true);
      const data = await apiGet(API_ENDPOINTS.EMAIL.GET(emailId));
      
      if (data.success) {
        return data.email;
      } else {
        throw new Error(data.error || 'Failed to fetch email');
      }
    } catch (err) {
      console.error('Error fetching full email:', err);
      setError(getErrorMessage(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteEmail = useCallback(async (emailId) => {
    try {
      const data = await apiDelete(API_ENDPOINTS.EMAIL.GET(emailId));
      
      if (data.success) {
        return true;
      } else {
        throw new Error(data.error || 'Failed to delete email');
      }
    } catch (err) {
      console.error('Error deleting email:', err);
      throw err;
    }
  }, []);

  const markEmailAsRead = useCallback(async (emailId) => {
    try {
      const data = await apiPost(`${API_ENDPOINTS.EMAIL.GET(emailId)}/mark-read`);
      
      if (data.success) {
        return true;
      } else {
        throw new Error(data.error || 'Failed to mark email as read');
      }
    } catch (err) {
      console.error('Error marking email as read:', err);
      throw err;
    }
  }, []);

  const toggleStar = useCallback(async (emailId, isStarred) => {
    try {
      const data = await apiPost(`${API_ENDPOINTS.EMAIL.GET(emailId)}/toggle-star`, {
        isStarred: isStarred
      });
      
      if (data.success) {
        return {
          isStarred: data.email?.isStarred ?? !isStarred,
          labelIds: data.email?.labelIds
        };
      } else {
        throw new Error(data.error || 'Failed to toggle star');
      }
    } catch (err) {
      console.error('Error toggling star:', err);
      throw err;
    }
  }, []);

  const sendEmail = useCallback(async (emailData) => {
    try {
      setLoading(true);
      const data = await apiPost(API_ENDPOINTS.EMAIL.SEND, emailData);
      
      if (data.success) {
        return true;
      } else {
        throw new Error(data.message || 'Failed to send email');
      }
    } catch (err) {
      console.error('Error sending email:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const replyToEmail = useCallback(async (emailId, body, replyAll = false) => {
    try {
      setLoading(true);
      const data = await apiPost(`${API_ENDPOINTS.EMAIL.GET(emailId)}/reply`, {
        body,
        replyAll,
      });
      
      if (data.success) {
        return true;
      } else {
        throw new Error(data.message || 'Failed to send reply');
      }
    } catch (err) {
      console.error('Error replying to email:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    fetchEmails,
    fetchFullEmail,
    deleteEmail,
    markEmailAsRead,
    toggleStar,
    sendEmail,
    replyToEmail,
    EMAILS_PER_PAGE,
  };
}
