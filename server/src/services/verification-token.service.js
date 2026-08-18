import crypto from 'node:crypto';

import { prisma } from '../db/prisma.js';
import { AppError } from '../errors/AppError.js';

const EMAIL_VERIFICATION_EXPIRATION_MINUTES = 15;
const PASSWORD_RESET_EXPIRATION_MINUTES = 15;
const PASSWORD_RESET_COOLDOWN_SECONDS = 60;

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

const EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS = 60;

export async function canRequestEmailVerification(userId) {
  const recentToken = await prisma.verificationToken.findFirst({
    where: {
      userId,
      type: 'EMAIL_VERIFICATION',
      createdAt: {
        gt: new Date(Date.now() - EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS * 1000),
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return !recentToken;
}

function generatePasswordResetToken() {
  return crypto.randomBytes(32).toString('hex');
}

function hashPasswordResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function createPasswordResetToken(userId) {
  const token = generatePasswordResetToken();
  const tokenHash = hashPasswordResetToken(token);

  const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRATION_MINUTES * 60 * 1000);

  await prisma.verificationToken.deleteMany({
    where: {
      userId,
      type: 'PASSWORD_RESET',
      usedAt: null,
    },
  });

  await prisma.verificationToken.create({
    data: {
      userId,
      type: 'PASSWORD_RESET',
      tokenHash,
      expiresAt,
    },
  });

  return token;
}

export async function consumePasswordResetToken(token) {
  const tokenHash = hashPasswordResetToken(token);

  const verificationToken = await prisma.verificationToken.findFirst({
    where: {
      type: 'PASSWORD_RESET',
      tokenHash,
      usedAt: null,
    },
  });

  if (!verificationToken || verificationToken.expiresAt <= new Date()) {
    throw new AppError(
      'Invalid or expired password reset token.',
      400,
      'INVALID_PASSWORD_RESET_TOKEN',
    );
  }

  return verificationToken;
}

export async function canRequestPasswordReset(userId) {
  const recentToken = await prisma.verificationToken.findFirst({
    where: {
      userId,
      type: 'PASSWORD_RESET',
      createdAt: {
        gt: new Date(Date.now() - PASSWORD_RESET_COOLDOWN_SECONDS * 1000),
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return !recentToken;
}
