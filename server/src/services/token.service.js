import crypto from 'node:crypto';

import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';

import { durationToMilliseconds } from '../utils/duration.js';

import { AppError } from '../errors/AppError.js';

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

function verifyToken(token, secret, expectedType) {
  try {
    const payload = jwt.verify(token, secret);

    if (payload.type !== expectedType) {
      throw new AppError('Authentication required.', 401, 'AUTHENTICATION_REQUIRED');
    }

    return payload;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError('Authentication required.', 401, 'AUTHENTICATION_REQUIRED');
  }
}

export function generateAccessToken(userId) {
  return jwt.sign(
    {
      sub: userId,
      type: 'access',
    },
    env.JWT_ACCESS_SECRET,
    {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    },
  );
}

export function generateRefreshToken(userId, sessionId) {
  return jwt.sign(
    {
      sub: userId,
      sid: sessionId,
      type: 'refresh',
      jti: crypto.randomUUID(),
    },
    env.JWT_REFRESH_SECRET,
    {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    },
  );
}

export function verifyAccessToken(token) {
  return verifyToken(token, env.JWT_ACCESS_SECRET, 'access');
}

export function verifyRefreshToken(token) {
  return verifyToken(token, env.JWT_REFRESH_SECRET, 'refresh');
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function getRefreshTokenExpiration() {
  return new Date(Date.now() + durationToMilliseconds(env.JWT_REFRESH_EXPIRES_IN));
}
