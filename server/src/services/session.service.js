import { prisma } from '../db/prisma.js';

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
