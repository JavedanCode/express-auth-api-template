import bcrypt from 'bcryptjs';

import { prisma } from '../db/prisma.js';
import { generateAccessToken } from './token.service.js';

import { AppError } from '../errors/AppError.js';

import { createSession } from './session.service.js';

export async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
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
