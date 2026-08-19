import bcrypt from 'bcryptjs';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import app from '../../src/app.js';
import { prisma } from '../../src/db/prisma.js';
import { sendEmail } from '../../src/services/email.service.js';
import { resetRateLimiters } from '../../src/middleware/rate-limit.middleware.js';

vi.mock('../../src/services/email.service.js', () => ({
  sendEmail: vi.fn().mockResolvedValue({
    id: 'test-email-id',
  }),
}));

describe('PATCH /users/me/email', () => {
  let user;
  let agent;

  const currentPassword = 'StrongPassword123!';

  beforeEach(async () => {
    vi.clearAllMocks();

    await resetRateLimiters();

    const passwordHash = await bcrypt.hash(currentPassword, 12);

    user = await prisma.user.create({
      data: {
        username: 'emailchangeuser',
        email: 'current@example.com',
        passwordHash,
        displayName: 'Email Change User',
        emailVerifiedAt: new Date(),
      },
    });

    agent = request.agent(app);

    const loginResponse = await agent.post('/auth/login').send({
      email: user.email,
      password: currentPassword,
    });

    expect(loginResponse.status).toBe(200);
  });

  afterEach(async () => {
    await prisma.verificationToken.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
  });

  it('creates an email change token and sends an email to the new address', async () => {
    const response = await agent.patch('/users/me/email').send({
      email: 'new@example.com',
    });

    expect(response.status).toBe(200);

    expect(response.body).toMatchObject({
      success: true,
      message: 'If the email can be changed, a verification email will be sent.',
    });

    expect(sendEmail).toHaveBeenCalledTimes(1);

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'new@example.com',
        subject: expect.any(String),
        html: expect.stringContaining('new@example.com'),
      }),
    );

    const token = await prisma.verificationToken.findFirst({
      where: {
        userId: user.id,
        type: 'EMAIL_CHANGE',
      },
    });

    expect(token).not.toBeNull();
    expect(token.targetEmail).toBe('new@example.com');
    expect(token.tokenHash).toHaveLength(64);
    expect(token.usedAt).toBeNull();
  });

  it('does not change the email before verification', async () => {
    await agent.patch('/users/me/email').send({
      email: 'new@example.com',
    });

    const updatedUser = await prisma.user.findUnique({
      where: {
        id: user.id,
      },
    });

    expect(updatedUser.email).toBe('current@example.com');
  });

  it('rejects an email address that is already registered', async () => {
    await prisma.user.create({
      data: {
        username: 'otheruser',
        email: 'taken@example.com',
        passwordHash: await bcrypt.hash('AnotherPassword123!', 12),
        emailVerifiedAt: new Date(),
      },
    });

    const response = await agent.patch('/users/me/email').send({
      email: 'taken@example.com',
    });

    expect(response.status).toBe(409);

    expect(response.body).toMatchObject({
      success: false,
      error: {
        code: 'EMAIL_ALREADY_EXISTS',
      },
    });

    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('rejects changing to the current email address', async () => {
    const response = await agent.patch('/users/me/email').send({
      email: user.email,
    });

    expect(response.status).toBe(400);

    expect(response.body).toMatchObject({
      success: false,
      error: {
        code: 'EMAIL_UNCHANGED',
      },
    });

    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('rejects an invalid email address', async () => {
    const response = await agent.patch('/users/me/email').send({
      email: 'not-an-email',
    });

    expect(response.status).toBe(400);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('rejects an unauthenticated request', async () => {
    const response = await request(app).patch('/users/me/email').send({
      email: 'new@example.com',
    });

    expect(response.status).toBe(401);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('does not create another token during the cooldown period', async () => {
    await agent.patch('/users/me/email').send({
      email: 'new@example.com',
    });

    expect(sendEmail).toHaveBeenCalledTimes(1);

    await agent.patch('/users/me/email').send({
      email: 'another@example.com',
    });

    expect(sendEmail).toHaveBeenCalledTimes(1);

    const tokens = await prisma.verificationToken.findMany({
      where: {
        userId: user.id,
        type: 'EMAIL_CHANGE',
      },
    });

    expect(tokens).toHaveLength(1);
  });

  it('rejects an empty request body', async () => {
    const response = await agent.patch('/users/me/email').send({});

    expect(response.status).toBe(400);
    expect(sendEmail).not.toHaveBeenCalled();
  });
});
