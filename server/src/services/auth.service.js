import { generateAccessToken } from './token.service.js';

import { createSession } from './session.service.js';

import { hashPassword } from './password.service.js';

import { createUser } from './user.service.js';

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
  const passwordHash = await hashPassword(password);

  return createUser({
    username,
    email,
    passwordHash,
  });
}
