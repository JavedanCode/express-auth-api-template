import { findUserById } from './user.service.js';
import {
  canRequestEmailChange,
  createEmailChangeToken,
  consumeEmailChangeToken,
} from './verification-token.service.js';
import { prisma } from '../db/prisma.js';
import { AppError } from '../errors/AppError.js';
import { sendEmail } from './email.service.js';
import { env } from '../config/env.js';
import { buildEmailChangeEmail } from '../emails/email-change.js';

export async function requestEmailChange(userId, targetEmail) {
  const user = await findUserById(userId);

  if (!user) {
    throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
  }

  if (user.email === targetEmail) {
    throw new AppError(
      'New email must be different from your current email.',
      400,
      'EMAIL_UNCHANGED',
    );
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      email: targetEmail,
    },
  });

  if (existingUser && existingUser.id !== userId) {
    throw new AppError('Email is already registered.', 409, 'EMAIL_ALREADY_EXISTS');
  }

  const canRequest = await canRequestEmailChange(userId);

  if (!canRequest) {
    return;
  }

  const token = await createEmailChangeToken(userId, targetEmail);

  const verificationUrl = `${env.EMAIL_CHANGE_URL}?token=${encodeURIComponent(token)}`;

  const emailContent = buildEmailChangeEmail({
    verificationUrl,
    targetEmail,
  });

  await sendEmail({
    to: targetEmail,
    subject: emailContent.subject,
    html: emailContent.html,
  });
}

export async function confirmEmailChange(userId, token) {
  const verificationToken = await consumeEmailChangeToken(token);

  if (verificationToken.userId !== userId) {
    throw new AppError('Invalid or expired email change token.', 400, 'INVALID_EMAIL_CHANGE_TOKEN');
  }

  const targetEmail = verificationToken.targetEmail;

  if (!targetEmail) {
    throw new AppError('Invalid or expired email change token.', 400, 'INVALID_EMAIL_CHANGE_TOKEN');
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      email: targetEmail,
    },
  });

  if (existingUser && existingUser.id !== userId) {
    throw new AppError('Email is already registered.', 409, 'EMAIL_ALREADY_EXISTS');
  }

  const changedAt = new Date();

  await prisma.$transaction([
    prisma.verificationToken.update({
      where: {
        id: verificationToken.id,
      },
      data: {
        usedAt: changedAt,
      },
    }),

    prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        email: targetEmail,
        emailVerifiedAt: changedAt,
      },
    }),
  ]);

  return true;
}
