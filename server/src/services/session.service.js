import { prisma } from '../db/prisma.js';

import { AppError } from '../errors/AppError.js';

import { generateRefreshToken, getRefreshTokenExpiration, hashToken } from './token.service.js';

export async function createSession({ userId, userAgent, ipAddress }) {
  const session = await prisma.session.create({
    data: {
      userId,
      refreshTokenHash: 'pending',
      expiresAt: getRefreshTokenExpiration(),
      userAgent,
      ipAddress,
    },
  });

  const refreshToken = generateRefreshToken(userId, session.id);

  const refreshTokenHash = hashToken(refreshToken);

  const updatedSession = await prisma.session.update({
    where: {
      id: session.id,
    },
    data: {
      refreshTokenHash,
    },
  });

  return {
    session: updatedSession,
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

  const result = await prisma.session.updateMany({
    where: {
      id: session.id,
      refreshTokenHash: currentTokenHash,
      revokedAt: null,
    },
    data: {
      refreshTokenHash: newRefreshTokenHash,
      lastUsedAt: new Date(),
      expiresAt: getRefreshTokenExpiration(),
    },
  });

  if (result.count !== 1) {
    await prisma.session.update({
      where: {
        id: session.id,
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
      lastUsedAt: new Date(),
    },
    refreshToken: newRefreshToken,
  };
}

export async function revokeSession(sessionId) {
  return prisma.session.update({
    where: {
      id: sessionId,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}
