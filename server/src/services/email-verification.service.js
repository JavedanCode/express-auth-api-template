import { findUserByEmail } from './auth.service.js';
import {
  canRequestEmailVerification,
  createEmailVerificationToken,
} from './verification-token.service.js';
import { buildEmailVerificationEmail } from '../emails/email-verification.js';
import { sendEmail } from './email.service.js';

export async function sendEmailVerification(user) {
  const code = await createEmailVerificationToken(user.id);

  const email = buildEmailVerificationEmail({
    code,
  });

  await sendEmail({
    to: user.email,
    subject: email.subject,
    html: email.html,
  });
}

export async function resendEmailVerification(email) {
  const user = await findUserByEmail(email);

  if (!user || user.emailVerifiedAt) {
    return;
  }

  const canRequest = await canRequestEmailVerification(user.id);

  if (!canRequest) {
    return;
  }

  await sendEmailVerification(user);
}
