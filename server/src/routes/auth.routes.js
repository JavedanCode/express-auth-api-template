import { Router } from 'express';
import passport from 'passport';

import { login, register } from '../controllers/auth.controller.js';

const router = Router();

router.post('/register', register);

router.post(
  '/login',
  passport.authenticate('local', {
    session: false,
  }),
  login,
);

export default router;
