import crypto from 'node:crypto';

import { prisma } from '../db/prisma.js';
import { AppError } from '../errors/AppError.js';

const EMAIL_VERIFICATION_EXPIRATION_MINUTES = 15;

function generateVerificationCode() {
  return crypto.randomInt(100000, 1000000).toString();
}

function hashVerificationCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

export async function createEmailVerificationToken(userId) {
  const code = generateVerificationCode();
  const tokenHash = hashVerificationCode(code);

  const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_EXPIRATION_MINUTES * 60 * 1000);

  await prisma.verificationToken.deleteMany({
    where: {
      userId,
      type: 'EMAIL_VERIFICATION',
      usedAt: null,
    },
  });

  await prisma.verificationToken.create({
    data: {
      userId,
      type: 'EMAIL_VERIFICATION',
      tokenHash,
      expiresAt,
    },
  });

  return code;
}

export async function verifyEmailVerificationToken(userId, code) {
  const tokenHash = hashVerificationCode(code);

  const token = await prisma.verificationToken.findFirst({
    where: {
      userId,
      type: 'EMAIL_VERIFICATION',
      tokenHash,
      usedAt: null,
    },
  });

  if (!token || token.expiresAt <= new Date()) {
    throw new AppError('Invalid or expired verification code.', 400, 'INVALID_VERIFICATION_CODE');
  }

  const verifiedAt = new Date();

  await prisma.$transaction([
    prisma.verificationToken.update({
      where: {
        id: token.id,
      },
      data: {
        usedAt: verifiedAt,
      },
    }),

    prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        emailVerifiedAt: verifiedAt,
      },
    }),
  ]);

  return true;
}
