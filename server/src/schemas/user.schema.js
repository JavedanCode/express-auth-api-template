import { z } from 'zod';

export const updateProfileSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .max(100, 'Display name must not exceed 100 characters.')
      .nullable()
      .optional(),

    avatarUrl: z
      .string()
      .trim()
      .url('Avatar URL must be a valid URL.')
      .max(2048, 'Avatar URL must not exceed 2048 characters.')
      .nullable()
      .optional(),
  })
  .refine((data) => data.displayName !== undefined || data.avatarUrl !== undefined, {
    message: 'At least one profile field must be provided.',
  });

export const updateUsernameSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters long.')
    .max(30, 'Username must not exceed 30 characters.')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username may only contain letters, numbers, and underscores.'),
});
