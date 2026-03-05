/**
 * Gmail routes.
 * Handles Gmail API operations including email fetching, sending, replying, and label management.
 * 
 * @module routes/gmail
 */

import { Router } from 'express';
import gmailService from '../services/gmailService.js';
import { requireAuth, asyncHandler, sendSuccess, sendError, sendValidationError, sendUnauthorized } from '../utils/response.js';
import { HTTP_STATUS } from '../constants/index.js';

const router = Router();

const handleTokenError = (error, res) => {
  if (error.message === 'TOKEN_EXPIRED') {
    return sendUnauthorized(res, 'Session expired. Please log in again');
  }
  return null;
};

router.get('/emails', requireAuth, asyncHandler(async (req, res) => {
  const { maxResults, pageToken, label, query } = req.query;
  
  const options = {
    maxResults: parseInt(maxResults) || 20,
    pageToken: pageToken || null,
    labelIds: label ? [label.toUpperCase()] : ['INBOX'],
    query: query || ''
  };

  try {
    const result = await gmailService.getEmails(
      req.user.accessToken,
      req.user.refreshToken,
      options
    );
    sendSuccess(res, result);
  } catch (error) {
    console.error('[Gmail Route] Error fetching emails:', error.message);
    const tokenError = handleTokenError(error, res);
    if (!tokenError) {
      sendError(res, 'Failed to fetch emails', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }
}));

router.get('/emails/:id', requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const email = await gmailService.getEmail(
      req.user.accessToken,
      req.user.refreshToken,
      id
    );
    sendSuccess(res, { email });
  } catch (error) {
    console.error('[Gmail Route] Error fetching email:', error.message);
    const tokenError = handleTokenError(error, res);
    if (!tokenError) {
      sendError(res, 'Failed to fetch email', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }
}));

router.get('/profile', requireAuth, asyncHandler(async (req, res) => {
  try {
    const profile = await gmailService.getProfile(
      req.user.accessToken,
      req.user.refreshToken
    );
    sendSuccess(res, { profile });
  } catch (error) {
    console.error('[Gmail Route] Error fetching profile:', error.message);
    const tokenError = handleTokenError(error, res);
    if (!tokenError) {
      sendError(res, 'Failed to fetch profile', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }
}));

router.get('/labels', requireAuth, asyncHandler(async (req, res) => {
  const defaultLabels = [
    { id: 'INBOX', name: 'Inbox', type: 'system' },
    { id: 'STARRED', name: 'Starred', type: 'system' },
    { id: 'IMPORTANT', name: 'Important', type: 'system' },
    { id: 'SENT', name: 'Sent', type: 'system' },
    { id: 'DRAFT', name: 'Drafts', type: 'system' },
    { id: 'TRASH', name: 'Trash', type: 'system' },
    { id: 'SPAM', name: 'Spam', type: 'system' }
  ];

  try {
    const result = await gmailService.getLabels(
      req.user.accessToken,
      req.user.refreshToken
    );
    sendSuccess(res, { labels: result.labels || defaultLabels });
  } catch (error) {
    console.error('[Gmail Route] Error fetching labels:', error.message);
    const tokenError = handleTokenError(error, res);
    if (tokenError) {
      return;
    }
    
    console.warn('[Gmail Route] Using default labels as fallback');
    sendSuccess(res, {
      labels: defaultLabels,
      fallback: true,
      error: error.message
    });
  }
}));

router.post('/emails/:id/mark-read', requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const result = await gmailService.markAsRead(
      req.user.accessToken,
      req.user.refreshToken,
      id
    );
    sendSuccess(res, { email: result }, 'Email marked as read');
  } catch (error) {
    console.error('[Gmail Route] Error marking email as read:', error.message);
    const tokenError = handleTokenError(error, res);
    if (!tokenError) {
      sendError(res, 'Failed to mark email as read', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }
}));

router.post('/emails/:id/toggle-star', requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isStarred } = req.body;

  if (typeof isStarred !== 'boolean') {
    return sendValidationError(res, 'isStarred must be a boolean');
  }

  try {
    const result = await gmailService.toggleStar(
      req.user.accessToken,
      req.user.refreshToken,
      id,
      isStarred
    );
    sendSuccess(res, { email: result }, result.isStarred ? 'Email starred' : 'Email unstarred');
  } catch (error) {
    console.error('[Gmail Route] Error toggling star:', error.message);
    const tokenError = handleTokenError(error, res);
    if (!tokenError) {
      sendError(res, 'Failed to toggle star', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }
}));

router.post('/emails/send', requireAuth, asyncHandler(async (req, res) => {
  const { to, subject, body, cc, bcc, replyTo } = req.body;

  if (!to || !subject || !body) {
    return sendValidationError(res, 'to, subject, and body are required');
  }

  const fromName = req.user.displayName || 
                  (req.user.firstName && req.user.lastName 
                    ? `${req.user.firstName} ${req.user.lastName}`.trim()
                    : req.user.firstName || req.user.lastName || null);
  const fromEmail = req.user.email;

  try {
    const result = await gmailService.sendEmail(
      req.user.accessToken,
      req.user.refreshToken,
      { to, subject, body, cc, bcc, replyTo, fromName, fromEmail }
    );
    sendSuccess(res, { email: result }, 'Email sent successfully');
  } catch (error) {
    console.error('[Gmail Route] Error sending email:', error.message);
    const tokenError = handleTokenError(error, res);
    if (!tokenError) {
      sendError(res, 'Failed to send email', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }
}));

router.post('/emails/:id/reply', requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { body, replyAll } = req.body;

  if (!body) {
    return sendValidationError(res, 'body is required');
  }

  const fromName = req.user.displayName || 
                  (req.user.firstName && req.user.lastName 
                    ? `${req.user.firstName} ${req.user.lastName}`.trim()
                    : req.user.firstName || req.user.lastName || null);
  const fromEmail = req.user.email;

  try {
    const result = await gmailService.replyToEmail(
      req.user.accessToken,
      req.user.refreshToken,
      id,
      { body, replyAll: replyAll === true, fromName, fromEmail }
    );
    sendSuccess(res, { email: result }, 'Reply sent successfully');
  } catch (error) {
    console.error('[Gmail Route] Error replying to email:', error.message);
    const tokenError = handleTokenError(error, res);
    if (!tokenError) {
      sendError(res, 'Failed to send reply', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }
}));

router.delete('/emails/:id', requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const result = await gmailService.deleteEmail(
      req.user.accessToken,
      req.user.refreshToken,
      id
    );
    sendSuccess(res, { email: result }, 'Email deleted successfully');
  } catch (error) {
    console.error('[Gmail Route] Error deleting email:', error.message);
    const tokenError = handleTokenError(error, res);
    if (!tokenError) {
      sendError(res, 'Failed to delete email', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }
}));

export default router;
