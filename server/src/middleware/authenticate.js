import { AppError } from '../errors/AppError.js';
import { findUserById } from '../services/user.service.js';
import { verifyAccessToken } from '../services/token.service.js';

export async function authenticate(req, res, next) {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      throw new AppError('Authentication required.', 401, 'AUTHENTICATION_REQUIRED');
    }

    const payload = verifyAccessToken(token);

    const user = await findUserById(payload.sub);

    if (!user) {
      throw new AppError('Authentication required.', 401, 'AUTHENTICATION_REQUIRED');
    }

    req.user = user;

    return next();
  } catch (error) {
    return next(error);
  }
}
