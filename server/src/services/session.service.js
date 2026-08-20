import crypto from 'node:crypto';

import { prisma } from '../db/prisma.js';

import { AppError } from '../errors/AppError.js';

import { generateRefreshToken, getRefreshTokenExpiration, hashToken } from './token.service.js';

export async function createSession({ userId, userAgent, ipAddress }) {
  const sessionId = crypto.randomUUID();

  const refreshToken = generateRefreshToken(userId, sessionId);

  const refreshTokenHash = hashToken(refreshToken);

  const session = await prisma.session.create({
    data: {
      id: sessionId,
      userId,
      refreshTokenHash,
      expiresAt: getRefreshTokenExpiration(),
      userAgent,
      ipAddress,
    },
  });

  return {
    session,
    refreshToken,
  };
}

export async function findSessionById(sessionId) {
  return prisma.session.findUnique({
    where: {
      id: sessionId,
    },
  });
}

export async function rotateSession({ sessionId, refreshToken }) {
  const currentTokenHash = hashToken(refreshToken);

  const session = await findSessionById(sessionId);

  if (!session) {
    throw new AppError('Authentication required.', 401, 'AUTHENTICATION_REQUIRED');
  }

  if (session.revokedAt || session.expiresAt <= new Date()) {
    throw new AppError('Authentication required.', 401, 'AUTHENTICATION_REQUIRED');
  }

  const newRefreshToken = generateRefreshToken(session.userId, session.id);

  const newRefreshTokenHash = hashToken(newRefreshToken);

  const now = new Date();
  const newExpiresAt = getRefreshTokenExpiration();

  const result = await prisma.session.updateMany({
    where: {
      id: session.id,
      refreshTokenHash: currentTokenHash,
      revokedAt: null,
    },
    data: {
      refreshTokenHash: newRefreshTokenHash,
      lastUsedAt: now,
      expiresAt: newExpiresAt,
    },
  });

  if (result.count !== 1) {
    await prisma.session.updateMany({
      where: {
        id: session.id,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    throw new AppError('Authentication required.', 401, 'AUTHENTICATION_REQUIRED');
  }

  return {
    session: {
      ...session,
      refreshTokenHash: newRefreshTokenHash,
      lastUsedAt: now,
      expiresAt: newExpiresAt,
    },
    refreshToken: newRefreshToken,
  };
}

export async function revokeSession(sessionId) {
  return prisma.session.updateMany({
    where: {
      id: sessionId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}

export async function revokeAllUserSessions(userId) {
  return prisma.session.updateMany({
    where: {
      userId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}
