import { Router } from 'express';

import { getMe, login, refresh, register, logout } from '../controllers/auth.controller.js';

import { authenticateLocal } from '../middleware/passport.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';

import { loginSchema, registerSchema } from '../schemas/auth.schema.js';

const router = Router();

router.post('/register', validate(registerSchema), register);

router.post('/login', validate(loginSchema), authenticateLocal, login);

router.get('/me', authenticate, getMe);

router.post('/refresh', refresh);

router.post('/logout', logout);

export default router;
