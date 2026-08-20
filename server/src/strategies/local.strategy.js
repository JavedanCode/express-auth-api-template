import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';

import { verifyPassword } from '../services/auth.service.js';
import { findUserByEmail } from '../services/user.service.js';

export function configureLocalStrategy() {
  passport.use(
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password',
      },
      async (email, password, done) => {
        try {
          const user = await findUserByEmail(email);

          if (!user || !user.passwordHash) {
            return done(null, false, {
              message: 'Invalid email or password.',
            });
          }

          const passwordValid = await verifyPassword(password, user.passwordHash);

          if (!passwordValid) {
            return done(null, false, {
              message: 'Invalid email or password.',
            });
          }

          if (!user.emailVerifiedAt) {
            return done(null, false, {
              message: 'Please verify your email address before logging in.',
              code: 'EMAIL_NOT_VERIFIED',
            });
          }

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      },
    ),
  );
}
