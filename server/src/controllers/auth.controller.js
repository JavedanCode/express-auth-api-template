import { createAuthentication, registerUser } from '../services/auth.service.js';
import { accessTokenCookieOptions, refreshTokenCookieOptions } from '../config/cookies.js';
import { rotateSession, revokeSession } from '../services/session.service.js';
import { generateAccessToken, verifyRefreshToken } from '../services/token.service.js';
import { createEmailVerificationToken } from '../services/verification-token.service.js';
import { sendEmail } from '../services/email.service.js';
import { buildEmailVerificationEmail } from '../emails/email-verification.js';
import { AppError } from '../errors/AppError.js';

export async function register(req, res, next) {
  try {
    const { username, email, password } = req.body;

    const user = await registerUser({
      username,
      email,
      password,
    });

    const verificationCode = await createEmailVerificationToken(user.id);

    const verificationEmail = buildEmailVerificationEmail({
      code: verificationCode,
    });

    await sendEmail({
      to: user.email,
      subject: verificationEmail.subject,
      html: verificationEmail.html,
    });

    return res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your email address.',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        emailVerifiedAt: user.emailVerifiedAt,
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

export async function logout(req, res, next) {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      try {
        const payload = verifyRefreshToken(refreshToken);

        await revokeSession(payload.sid);
      } catch {
        // Logout should remain safe and idempotent.
        // Invalid or expired authentication should not prevent
        // the client from clearing its cookies.
      }
    }

    res.clearCookie('accessToken', accessTokenCookieOptions);
    res.clearCookie('refreshToken', refreshTokenCookieOptions);

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}
