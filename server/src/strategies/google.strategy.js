import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

import { AuthProvider } from '../../generated/prisma/enums.ts';
import { env } from '../config/env.js';
import { findOrCreateOAuthUser } from '../services/oauth.service.js';
import { processGoogleProfile } from './oauth-profile.js';

export function configureGoogleStrategy() {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_CALLBACK_URL) {
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const user = await processGoogleProfile(profile, {
            findOrCreateOAuthUser,
            provider: AuthProvider.GOOGLE,
          });

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      },
    ),
  );
}
