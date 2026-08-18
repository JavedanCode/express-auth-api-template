import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long.')
  .max(128, 'Password must not exceed 128 characters.');

export const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters long.')
    .max(30, 'Username must not exceed 30 characters.')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username may only contain letters, numbers, and underscores.'),

  email: z.string().trim().toLowerCase().email('Please provide a valid email address.'),

  password: passwordSchema,
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Please provide a valid email address.'),

  password: z.string().min(1, 'Password is required.'),
});

export const verifyEmailSchema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/, 'Verification code must be 6 digits.'),
});

export const resendEmailVerificationSchema = z.object({
  email: z.string().email(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required.'),
  newPassword: passwordSchema,
});
