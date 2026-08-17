import { env } from './env.js';
import { durationToMilliseconds } from '../utils/duration.js';

const isProduction = env.NODE_ENV === 'production';

export const accessTokenCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax',
  path: '/',
  maxAge: durationToMilliseconds(env.JWT_ACCESS_EXPIRES_IN),
};

export const refreshTokenCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax',
  path: '/auth',
  maxAge: durationToMilliseconds(env.JWT_REFRESH_EXPIRES_IN),
};
