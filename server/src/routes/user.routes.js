import { Router } from 'express';

import { changePassword } from '../controllers/user.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { changePasswordSchema } from '../schemas/user.schema.js';

const router = Router();

router.patch('/me/password', authenticate, validate(changePasswordSchema), changePassword);

export default router;
