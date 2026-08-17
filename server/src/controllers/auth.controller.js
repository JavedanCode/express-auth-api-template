import { createAuthentication } from '../services/auth.service.js';
import { env } from '../config/env.js';

export async function login(req, res, next) {
  try {
    const { accessToken, refreshToken } = await createAuthentication({
      userId: req.user.id,
      userAgent: req.get('user-agent'),
      ipAddress: req.ip,
    });

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

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
