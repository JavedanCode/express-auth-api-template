import bcrypt from 'bcryptjs';

import { prisma } from '../db/prisma.js';
import { AppError } from '../errors/AppError.js';
import { verifyPassword } from './auth.service.js';
import { revokeAllUserSessions } from './session.service.js';

export async function changeUserPassword({ userId, currentPassword, newPassword }) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user || !user.passwordHash) {
    throw new AppError('Current password is incorrect.', 401, 'INVALID_CURRENT_PASSWORD');
  }

  const currentPasswordValid = await verifyPassword(currentPassword, user.passwordHash);

  if (!currentPasswordValid) {
    throw new AppError('Current password is incorrect.', 401, 'INVALID_CURRENT_PASSWORD');
  }

  const samePassword = await bcrypt.compare(newPassword, user.passwordHash);

  if (samePassword) {
    throw new AppError(
      'New password must be different from your current password.',
      400,
      'PASSWORD_UNCHANGED',
    );
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  const updatedUser = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      passwordHash,
    },
  });

  await revokeAllUserSessions(userId);

  return updatedUser;
}

export async function updateUserProfile({ userId, displayName, avatarUrl }) {
  const user = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      ...(displayName !== undefined && { displayName }),
      ...(avatarUrl !== undefined && { avatarUrl }),
    },
    select: {
      id: true,
      username: true,
      email: true,
      displayName: true,
      avatarUrl: true,
    },
  });

  return user;
}
