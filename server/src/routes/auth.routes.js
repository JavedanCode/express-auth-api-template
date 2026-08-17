import { Router } from 'express';
import { authenticateLocal } from '../middleware/passport.js';

import { login, register } from '../controllers/auth.controller.js';

const router = Router();

router.post('/register', register);

router.post('/login', authenticateLocal, login);

export default router;
