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
