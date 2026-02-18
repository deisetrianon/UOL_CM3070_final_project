import { Router } from 'express';
import gmailService from '../services/gmailService.js';

const router = Router();

// Checking if user is authenticated
const requireAuth = (req, res, next) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({
      success: false,
      error: 'Not authenticated',
      message: 'Please log in to access this resource'
    });
  }
  next();
};

/**
 * GET /api/gmail/emails
 * Fetch user's emails from Gmail
 */
router.get('/emails', requireAuth, async (req, res) => {
  try {
    const { maxResults, pageToken, label, query } = req.query;
    
    const options = {
      maxResults: parseInt(maxResults) || 20,
      pageToken: pageToken || null,
      labelIds: label ? [label.toUpperCase()] : ['INBOX'],
      query: query || ''
    };

    const result = await gmailService.getEmails(
      req.user.accessToken,
      req.user.refreshToken,
      options
    );

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('[Gmail Route] Error fetching emails:', error.message);
    
    if (error.message === 'TOKEN_EXPIRED') {
      return res.status(401).json({
        success: false,
        error: 'Session expired',
        message: 'Please log in again'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to fetch emails',
      message: error.message
    });
  }
});

/**
 * GET /api/gmail/emails/:id
 * Fetch a single email by ID
 */
router.get('/emails/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const email = await gmailService.getEmail(
      req.user.accessToken,
      req.user.refreshToken,
      id
    );

    res.json({
      success: true,
      email
    });
  } catch (error) {
    console.error('[Gmail Route] Error fetching email:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch email',
      message: error.message
    });
  }
});

/**
 * GET /api/gmail/profile
 * Fetch user's Gmail profile
 */
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const profile = await gmailService.getProfile(
      req.user.accessToken,
      req.user.refreshToken
    );

    res.json({
      success: true,
      profile
    });
  } catch (error) {
    console.error('[Gmail Route] Error fetching profile:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile',
      message: error.message
    });
  }
});

/**
 * GET /api/gmail/labels
 * Fetch available Gmail labels
 */
router.get('/labels', requireAuth, async (req, res) => {
  // Returning commonly used labels
  // (TODO: In a full implementation, this would fetch from Gmail API)
  res.json({
    success: true,
    labels: [
      { id: 'INBOX', name: 'Inbox', type: 'system' },
      { id: 'STARRED', name: 'Starred', type: 'system' },
      { id: 'IMPORTANT', name: 'Important', type: 'system' },
      { id: 'SENT', name: 'Sent', type: 'system' },
      { id: 'DRAFT', name: 'Drafts', type: 'system' },
      { id: 'TRASH', name: 'Trash', type: 'system' },
      { id: 'SPAM', name: 'Spam', type: 'system' }
    ]
  });
});

/**
 * POST /api/gmail/emails/:id/mark-read
 * Mark an email as read (remove UNREAD label)
 */
router.post('/emails/:id/mark-read', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await gmailService.markAsRead(
      req.user.accessToken,
      req.user.refreshToken,
      id
    );

    res.json({
      success: true,
      message: 'Email marked as read',
      email: result
    });
  } catch (error) {
    console.error('[Gmail Route] Error marking email as read:', error.message);
    
    if (error.message === 'TOKEN_EXPIRED') {
      return res.status(401).json({
        success: false,
        error: 'Session expired',
        message: 'Please log in again'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to mark email as read',
      message: error.message
    });
  }
});

/**
 * POST /api/gmail/emails/:id/toggle-star
 * Toggle star on an email (add/remove STARRED label)
 */
router.post('/emails/:id/toggle-star', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { isStarred } = req.body;

    if (typeof isStarred !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'isStarred must be a boolean'
      });
    }

    const result = await gmailService.toggleStar(
      req.user.accessToken,
      req.user.refreshToken,
      id,
      isStarred
    );

    res.json({
      success: true,
      message: result.isStarred ? 'Email starred' : 'Email unstarred',
      email: result
    });
  } catch (error) {
    console.error('[Gmail Route] Error toggling star:', error.message);
    
    if (error.message === 'TOKEN_EXPIRED') {
      return res.status(401).json({
        success: false,
        error: 'Session expired',
        message: 'Please log in again'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to toggle star',
      message: error.message
    });
  }
});

export default router;
