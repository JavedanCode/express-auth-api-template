import { buildEmailVerificationEmail } from '../emails/email-verification.js';
import { sendEmail } from './email.service.js';
import { createEmailVerificationToken } from './verification-token.service.js';

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
