import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

import { env } from '../config/env.js';
import { AuthProvider } from '../../generated/prisma/enums.ts';
import { findOrCreateOAuthUser } from '../services/oauth.service.js';

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
          const email = profile.emails?.[0]?.value;
          const emailVerified = profile.emails?.[0]?.verified;

          if (!email || !emailVerified) {
            return done(new Error('Google account does not provide a verified email address.'));
          }

          const user = await findOrCreateOAuthUser({
            provider: AuthProvider.GOOGLE,
            providerAccountId: profile.id,
            email: email.toLowerCase(),
            displayName: profile.displayName || null,
            avatarUrl: profile.photos?.[0]?.value || null,
          });

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      },
    ),
  );
}
