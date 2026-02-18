import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import config from './index.js';
import User from '../models/User.js';

/**
 * Configure Passport.js with Google OAuth 2.0 Strategy
 * This enables Google Sign-In and Gmail API access
 * Users are persisted to MongoDB via the User model
 */

// Serializing user ID for the session
passport.serializeUser((user, done) => {
  done(null, user.id || user._id);
});

// Deserializing user from the session by fetching from database
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    if (user) {
      done(null, user.toSessionJSON());
    } else {
      done(null, false);
    }
  } catch (error) {
    console.error('[Passport] Error deserializing user:', error.message);
    done(error, null);
  }
});

// Configuring Google OAuth if credentials are available
if (config.google.clientId && config.google.clientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.google.clientId,
        clientSecret: config.google.clientSecret,
        callbackURL: config.google.callbackUrl,
        scope: [
          'profile',
          'email',
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/gmail.modify',
          'https://www.googleapis.com/auth/calendar.readonly'
        ],
        accessType: 'offline',  // Getting refresh token
        prompt: 'consent'       // Always showing consent screen to get refresh token
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Finding or creating user in MongoDB
          const user = await User.findOrCreateFromGoogle(
            profile,
            accessToken,
            refreshToken
          );

          console.log(`[Auth] User authenticated and saved: ${user.email}`);
          
          return done(null, user.toSessionJSON());
        } catch (error) {
          console.error('[Auth] Error in Google strategy:', error);
          return done(error, null);
        }
      }
    )
  );
  console.log('[Passport] Google OAuth strategy configured');
} else {
  console.warn('[Passport] Google OAuth credentials not configured - authentication will not work');
}

export default passport;
