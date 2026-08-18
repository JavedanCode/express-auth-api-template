import { findUserByEmail } from './auth.service.js';
import { canRequestPasswordReset, createPasswordResetToken } from './verification-token.service.js';
import { sendEmail } from './email.service.js';
import { buildPasswordResetEmail } from '../emails/password-reset.js';
import { env } from '../config/env.js';

export async function requestPasswordReset(email) {
  const user = await findUserByEmail(email);

  if (!user) {
    return;
  }

  const canRequest = await canRequestPasswordReset(user.id);

  if (!canRequest) {
    return;
  }

  const token = await createPasswordResetToken(user.id);

  const resetUrl = `${env.PASSWORD_RESET_URL}?token=${encodeURIComponent(token)}`;

  const emailContent = buildPasswordResetEmail({
    resetUrl,
  });

  await sendEmail({
    to: user.email,
    subject: emailContent.subject,
    html: emailContent.html,
  });
}
