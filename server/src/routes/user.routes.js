import { Router } from 'express';

import {
  changePassword,
  updateProfile,
  changeUsernameController,
} from '../controllers/user.controller.js';

import { authenticate } from '../middleware/authenticate.js';

import { validate } from '../middleware/validate.js';

import { changePasswordSchema } from '../schemas/auth.schema.js';

import { updateProfileSchema, updateUsernameSchema } from '../schemas/user.schema.js';

const router = Router();

router.patch('/me', authenticate, validate(updateProfileSchema), updateProfile);

router.patch('/me/password', authenticate, validate(changePasswordSchema), changePassword);

router.patch(
  '/me/username',
  authenticate,
  validate(updateUsernameSchema),
  changeUsernameController,
);

export default router;
