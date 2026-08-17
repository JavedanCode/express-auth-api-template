import bcrypt from 'bcryptjs';

import { prisma } from '../db/prisma.js';
import { generateRefreshToken, hashToken } from './token.service.js';

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
