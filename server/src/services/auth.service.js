import bcrypt from 'bcryptjs';

import { prisma } from '../db/prisma.js';
import { generateRefreshToken, getRefreshTokenExpiration, hashToken } from './token.service.js';

export async function findUserByEmail(email) {
  return prisma.user.findUnique({
    where: {
      email,
    },
  });
}

export async function findUserById(userId) {
  return prisma.user.findUnique({
    where: {
      id: userId,
    },
  });
}

export async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

export async function createSession({ userId, userAgent, ipAddress }) {
  const session = await prisma.session.create({
    data: {
      userId,
      refreshTokenHash: 'pending',
      expiresAt: getRefreshTokenExpiration,
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
      expiresAt: getRefreshTokenExpiration(),
    },
  });

  return {
    session: updatedSession,
    refreshToken,
  };
}
