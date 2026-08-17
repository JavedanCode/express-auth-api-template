import bcrypt from 'bcryptjs';

import { prisma } from '../db/prisma.js';
import {
  generateRefreshToken,
  getRefreshTokenExpiration,
  hashToken,
  generateAccessToken,
} from './token.service.js';

import { AppError } from '../errors/AppError.js';

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
      expiresAt: getRefreshTokenExpiration(),
    },
  });

  return {
    session: updatedSession,
    refreshToken,
  };
}

export async function createAuthentication({ userId, userAgent, ipAddress }) {
  const { session, refreshToken } = await createSession({
    userId,
    userAgent,
    ipAddress,
  });

  const accessToken = generateAccessToken(userId);

  return {
    accessToken,
    refreshToken,
    session,
  };
}

export async function registerUser({ username, email, password }) {
  const existingEmail = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (existingEmail) {
    throw new AppError('Email is already registered.', 409, 'EMAIL_ALREADY_EXISTS');
  }

  const existingUsername = await prisma.user.findUnique({
    where: {
      username,
    },
  });

  if (existingUsername) {
    throw new AppError('Username is already taken.', 409, 'USERNAME_ALREADY_EXISTS');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  return prisma.user.create({
    data: {
      username,
      email,
      passwordHash,
    },
  });
}
