import { env } from '../config/env.js';
import { accessTokenCookieOptions, refreshTokenCookieOptions } from '../config/cookies.js';
import { AppError } from '../errors/AppError.js';
import { createAuthentication } from '../services/auth.service.js';

export async function googleCallback(req, res, next) {
  try {
    if (!req.user) {
      throw new AppError('OAuth authentication failed.', 401, 'OAUTH_AUTHENTICATION_FAILED');
    }

    const { accessToken, refreshToken } = await createAuthentication({
      userId: req.user.id,
      userAgent: req.get('user-agent'),
      ipAddress: req.ip,
    });

    res.cookie('accessToken', accessToken, accessTokenCookieOptions);
    res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions);

    return res.redirect(env.CLIENT_URL);
  } catch (error) {
    return next(error);
  }
}
