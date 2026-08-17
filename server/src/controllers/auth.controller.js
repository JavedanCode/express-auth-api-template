import { createAuthentication, registerUser } from '../services/auth.service.js';
import { env } from '../config/env.js';
import { accessTokenCookieOptions, refreshTokenCookieOptions } from '../config/cookies.js';
import { rotateSession } from '../services/session.service.js';
import { generateAccessToken, verifyRefreshToken } from '../services/token.service.js';
import { AppError } from '../errors/AppError.js';

export async function register(req, res, next) {
  try {
    const { username, email, password } = req.body;

    const user = await registerUser({
      username,
      email,
      password,
    });

    return res.status(201).json({
      success: true,
      message: 'Registration successful.',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { accessToken, refreshToken } = await createAuthentication({
      userId: req.user.id,
      userAgent: req.get('user-agent'),
      ipAddress: req.ip,
    });

    res.cookie('accessToken', accessToken, accessTokenCookieOptions);

    res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        displayName: req.user.displayName,
        avatarUrl: req.user.avatarUrl,
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function getMe(req, res) {
  return res.status(200).json({
    success: true,
    user: {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      displayName: req.user.displayName,
      avatarUrl: req.user.avatarUrl,
    },
  });
}

export async function refresh(req, res, next) {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      throw new AppError('Authentication required.', 401, 'AUTHENTICATION_REQUIRED');
    }

    const payload = verifyRefreshToken(refreshToken);

    const { session, refreshToken: newRefreshToken } = await rotateSession({
      sessionId: payload.sid,
      refreshToken,
    });

    const accessToken = generateAccessToken(session.userId);

    res.cookie('accessToken', accessToken, accessTokenCookieOptions);

    res.cookie('refreshToken', newRefreshToken, refreshTokenCookieOptions);

    return res.status(200).json({
      success: true,
      message: 'Token refreshed successfully.',
    });
  } catch (error) {
    return next(error);
  }
}
