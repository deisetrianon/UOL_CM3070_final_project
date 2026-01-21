import { Router } from 'express';
import passport from '../config/passport.js';
import config from '../config/index.js';

const router = Router();

/**
 * Check if Google OAuth is configured
 */
const isGoogleConfigured = () => {
  return !!(config.google.clientId && config.google.clientSecret);
};

/**
 * Authentication Routes
 * Handles Google OAuth 2.0 authentication flow
 */

/**
 * GET /api/auth/google
 * Initiates Google OAuth flow
 */
router.get('/google', (req, res, next) => {
  if (!isGoogleConfigured()) {
    return res.redirect(`${config.clientUrl}/login?error=oauth_not_configured`);
  }
  
  passport.authenticate('google', {
    scope: [
      'profile',
      'email',
      'https://www.googleapis.com/auth/gmail.readonly'
    ],
    accessType: 'offline',
    prompt: 'consent'
  })(req, res, next);
});

/**
 * GET /api/auth/google/callback
 * Handles Google OAuth callback
 */
router.get('/google/callback', (req, res, next) => {
  if (!isGoogleConfigured()) {
    return res.redirect(`${config.clientUrl}/login?error=oauth_not_configured`);
  }
  
  passport.authenticate('google', {
    failureRedirect: `${config.clientUrl}/login?error=auth_failed`
  })(req, res, (err) => {
    if (err) {
      console.error('[Auth] OAuth callback error:', err);
      return res.redirect(`${config.clientUrl}/login?error=auth_failed`);
    }
    // Successful authentication
    console.log('[Auth] Google OAuth successful, redirecting to home');
    res.redirect(`${config.clientUrl}/home`);
  });
});

/**
 * GET /api/auth/user
 * Returns current authenticated user info
 */
router.get('/user', (req, res) => {
  if (req.isAuthenticated() && req.user) {
    res.json({
      success: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        displayName: req.user.displayName,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        picture: req.user.picture
      },
      isAuthenticated: true
    });
  } else {
    res.json({
      success: false,
      user: null,
      isAuthenticated: false
    });
  }
});

/**
 * GET /api/auth/status
 * Check authentication status (lightweight)
 */
router.get('/status', (req, res) => {
  res.json({
    isAuthenticated: req.isAuthenticated(),
    hasUser: !!req.user
  });
});

/**
 * POST /api/auth/logout
 * Logs out the current user
 */
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('[Auth] Logout error:', err);
      return res.status(500).json({
        success: false,
        error: 'Failed to logout'
      });
    }

    req.session.destroy((sessionErr) => {
      if (sessionErr) {
        console.error('[Auth] Session destroy error:', sessionErr);
      }
      
      res.clearCookie('connect.sid');
      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    });
  });
});

/**
 * GET /api/auth/config
 * Returns OAuth configuration status (for debugging)
 */
router.get('/config', (req, res) => {
  res.json({
    configured: isGoogleConfigured(),
    callbackUrl: config.google.callbackUrl,
    clientUrl: config.clientUrl,
    message: isGoogleConfigured() 
      ? 'Google OAuth is configured' 
      : 'Please configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in server/.env'
  });
});

export default router;
