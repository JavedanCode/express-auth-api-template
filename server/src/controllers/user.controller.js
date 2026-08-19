import { changeUserPassword, updateUserProfile, changeUsername } from '../services/user.service.js';

export async function updateProfile(req, res, next) {
  try {
    const { displayName, avatarUrl } = req.body;

    const user = await updateUserProfile({
      userId: req.user.id,
      displayName,
      avatarUrl,
    });

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user,
    });
  } catch (error) {
    return next(error);
  }
}

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

export async function changeUsernameController(req, res, next) {
  try {
    const { username } = req.body;

    const user = await changeUsername({
      userId: req.user.id,
      username,
    });

    return res.status(200).json({
      success: true,
      message: 'Username updated successfully.',
      user: {
        id: user.id,
        username: user.username,
      },
    });
  } catch (error) {
    return next(error);
  }
}
