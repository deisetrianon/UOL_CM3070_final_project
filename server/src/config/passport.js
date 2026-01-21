import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import config from './index.js';

/**
 * Configure Passport.js with Google OAuth 2.0 Strategy
 * This enables Google Sign-In and Gmail API access
 */

// Serialize user for the session
passport.serializeUser((user, done) => {
  done(null, user);
});

// Deserialize user from the session
passport.deserializeUser((user, done) => {
  done(null, user);
});

// Only configure Google OAuth if credentials are available
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
          'https://www.googleapis.com/auth/gmail.readonly'  // Read-only Gmail access
        ],
        accessType: 'offline',  // Get refresh token
        prompt: 'consent'       // Always show consent screen to get refresh token
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Create user object with profile and tokens
          const user = {
            id: profile.id,
            email: profile.emails?.[0]?.value,
            displayName: profile.displayName,
            firstName: profile.name?.givenName,
            lastName: profile.name?.familyName,
            picture: profile.photos?.[0]?.value,
            accessToken,
            refreshToken,
            tokenExpiry: Date.now() + 3600 * 1000  // Token expires in 1 hour
          };

          console.log(`[Auth] User authenticated: ${user.email}`);
          
          return done(null, user);
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
