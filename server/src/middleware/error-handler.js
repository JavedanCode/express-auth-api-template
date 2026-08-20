import { ZodError } from 'zod';
import { Prisma } from '../../generated/prisma/client.ts';

import { AppError } from '../errors/AppError.js';

export function errorHandler(error, req, res, _next) {
  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed.',
        details: error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      },
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      const target = error.meta?.target;

      if (Array.isArray(target) && target.includes('email')) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'EMAIL_ALREADY_EXISTS',
            message: 'Email is already registered.',
          },
        });
      }

      if (Array.isArray(target) && target.includes('username')) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'USERNAME_ALREADY_EXISTS',
            message: 'Username is already taken.',
          },
        });
      }

      return res.status(409).json({
        success: false,
        error: {
          code: 'UNIQUE_CONSTRAINT_VIOLATION',
          message: 'A resource with the provided value already exists.',
        },
      });
    }
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    });
  }

  console.error(error);

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred.',
    },
  });
}
