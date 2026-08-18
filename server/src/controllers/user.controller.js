import { changeUserPassword } from '../services/user.service.js';

export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;

    await changeUserPassword({
      userId: req.user.id,
      currentPassword,
      newPassword,
    });

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully. Please log in again.',
    });
  } catch (error) {
    return next(error);
  }
}
