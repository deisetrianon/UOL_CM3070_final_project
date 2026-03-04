import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import config from './index.js';
import User from '../models/User.js';

passport.serializeUser((user, done) => {
  done(null, user.id || user._id);
});

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
          'https://www.googleapis.com/auth/gmail.send',
          'https://www.googleapis.com/auth/calendar.readonly'
        ],
        accessType: 'offline',
        prompt: 'consent'
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
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
