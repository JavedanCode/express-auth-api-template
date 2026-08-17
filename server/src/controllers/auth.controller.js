import { createAuthentication, registerUser } from '../services/auth.service.js';
import { env } from '../config/env.js';
import { accessTokenCookieOptions, refreshTokenCookieOptions } from '../config/cookies.js';

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
