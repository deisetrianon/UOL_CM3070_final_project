/**
 * Authentication routes.
 * Handles Google OAuth authentication, login, logout, and user session management.
 * 
 * @module routes/auth
 */

import { Router } from 'express';
import passport from '../config/passport.js';
import config from '../config/index.js';

const router = Router();

const isGoogleConfigured = () => {
  return !!(config.google.clientId && config.google.clientSecret);
};

router.get('/google', (req, res, next) => {
  if (!isGoogleConfigured()) {
    return res.redirect(`${config.clientUrl}/login?error=oauth_not_configured`);
  }
  
  passport.authenticate('google', {
    scope: [
      'profile',
      'email',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/calendar.readonly'
    ],
    accessType: 'offline',
    prompt: 'consent',
    hl: 'en-GB'
  })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
  if (!isGoogleConfigured()) {
    return res.redirect(`${config.clientUrl}/login?error=oauth_not_configured`);
  }
  
  passport.authenticate('google', {
    failureRedirect: `${config.clientUrl}/login?error=auth_failed`
  })(req, res, (err) => {
    if (err) {
      console.error('[Auth] OAuth callback error:', err);    
      let errorType = 'auth_failed';

      if (err.oauthError) {
        const oauthErr = err.oauthError;
        if (oauthErr.code === 'ETIMEDOUT' || oauthErr.code === 'ECONNREFUSED') {
          errorType = 'network_error';
          console.error('[Auth] Network error connecting to Google OAuth:', oauthErr.message);
        } else if (oauthErr.statusCode === 400 || oauthErr.statusCode === 401) {
          errorType = 'invalid_credentials';
          console.error('[Auth] Invalid OAuth credentials or token expired');
        }
      }
      
      return res.redirect(`${config.clientUrl}/login?error=${errorType}`);
    }

    console.log('[Auth] Google OAuth successful, redirecting to home');
    res.redirect(`${config.clientUrl}/home`);
  });
});

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

router.get('/status', (req, res) => {
  res.json({
    isAuthenticated: req.isAuthenticated(),
    hasUser: !!req.user
  });
});

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
