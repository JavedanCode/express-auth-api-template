import { Resend } from 'resend';

import { env } from '../config/env.js';

import { AppError } from '../errors/AppError.js';

const resend = new Resend(env.RESEND_API_KEY);

export async function sendEmail({ to, subject, html }) {
  const { data, error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject,
    html,
  });

  if (error) {
    throw new AppError(
      'Unable to deliver the email. Please try again later.',
      503,
      'EMAIL_DELIVERY_FAILED',
    );
  }

  return data;
}
