import 'dotenv/config';

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const { data, error } = await resend.emails.send({
  from: process.env.EMAIL_FROM,
  to: 'idkwtftodo2021@gmail.com',
  subject: 'Messaging API — Resend test',
  html: `
    <h1>It works!</h1>
    <p>This is a test email from the Messaging API.</p>
  `,
});

if (error) {
  console.error('Resend error:', error);
  process.exit(1);
}

console.log('Email sent successfully:', data);
