import { Router } from 'express';

import { login, register, getMe } from '../controllers/auth.controller.js';

import { authenticateLocal } from '../middleware/passport.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';

import { loginSchema, registerSchema } from '../schemas/auth.schema.js';

const router = Router();

router.post('/register', validate(registerSchema), register);

router.post('/login', validate(loginSchema), authenticateLocal, login);

router.get('/me', authenticate, getMe);

export default router;
