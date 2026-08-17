import { Router } from 'express';

import { getMe, login, refresh, register, logout } from '../controllers/auth.controller.js';

import { googleCallback, startGoogleOAuth } from '../controllers/oauth.controller.js';

import { authenticateLocal } from '../middleware/passport.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import {
  loginRateLimiter,
  refreshRateLimiter,
  registerRateLimiter,
} from '../middleware/rate-limit.middleware.js';

import { loginSchema, registerSchema } from '../schemas/auth.schema.js';

import { AppError } from '../errors/AppError.js';

import passport from 'passport';

const router = Router();

router.post('/register', registerRateLimiter, validate(registerSchema), register);

router.post('/login', loginRateLimiter, validate(loginSchema), authenticateLocal, login);

router.get('/me', authenticate, getMe);

router.post('/refresh', refreshRateLimiter, refresh);

router.post('/logout', logout);

router.get('/google', startGoogleOAuth);

router.get('/google/authorize', (req, res, next) => {
  const state = req.cookies.oauthState;

  if (!state) {
    return next(new AppError('OAuth authentication failed.', 401, 'OAUTH_STATE_INVALID'));
  }

  return passport.authenticate('google', {
    scope: ['profile', 'email'],
    state,
    session: false,
  })(req, res, next);
});

router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
  }),
  googleCallback,
);
export default router;
