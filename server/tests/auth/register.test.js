import bcrypt from 'bcryptjs';
import request from 'supertest';
import { beforeEach, vi } from 'vitest';

import app from '../../src/app.js';
import { prisma } from '../../src/db/prisma.js';

vi.mock('../../src/services/email.service.js', () => ({
  sendEmail: vi.fn().mockResolvedValue({
    id: 'test-email-id',
  }),
}));

describe('POST /auth/register', () => {
  beforeEach(async () => {
    await prisma.verificationToken.deleteMany();
    await prisma.user.deleteMany();
  });

  afterEach(async () => {
    await prisma.verificationToken.deleteMany();
    await prisma.user.deleteMany();
  });

  it('registers a new user and creates an email verification token', async () => {
    const response = await request(app).post('/auth/register').send({
      username: 'testuser',
      email: 'test@example.com',
      password: 'StrongPassword123!',
    });

    expect(response.status).toBe(201);

    expect(response.body).toMatchObject({
      success: true,
      message: 'Registration successful. Please verify your email address.',
      user: {
        username: 'testuser',
        email: 'test@example.com',
        displayName: null,
        avatarUrl: null,
        emailVerifiedAt: null,
      },
    });

    expect(response.body.user).not.toHaveProperty('passwordHash');

    const user = await prisma.user.findUnique({
      where: {
        email: 'test@example.com',
      },
    });

    expect(user).not.toBeNull();
    expect(user.username).toBe('testuser');
    expect(user.emailVerifiedAt).toBeNull();
    expect(user.passwordHash).not.toBe('StrongPassword123!');

    const passwordMatches = await bcrypt.compare('StrongPassword123!', user.passwordHash);

    expect(passwordMatches).toBe(true);

    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        userId: user.id,
        type: 'EMAIL_VERIFICATION',
      },
    });

    expect(verificationToken).not.toBeNull();
    expect(verificationToken.tokenHash).toBeTruthy();
    expect(verificationToken.usedAt).toBeNull();
    expect(verificationToken.expiresAt).toBeInstanceOf(Date);
  });

  it('rejects an existing email', async () => {
    const passwordHash = await bcrypt.hash('StrongPassword123!', 12);

    await prisma.user.create({
      data: {
        username: 'existinguser',
        email: 'existing@example.com',
        passwordHash,
      },
    });

    const response = await request(app).post('/auth/register').send({
      username: 'anotheruser',
      email: 'existing@example.com',
      password: 'AnotherPassword123!',
    });

    expect(response.status).toBe(409);
  });

  it('rejects an existing username', async () => {
    const passwordHash = await bcrypt.hash('StrongPassword123!', 12);

    await prisma.user.create({
      data: {
        username: 'existinguser',
        email: 'existing@example.com',
        passwordHash,
      },
    });

    const response = await request(app).post('/auth/register').send({
      username: 'existinguser',
      email: 'another@example.com',
      password: 'AnotherPassword123!',
    });

    expect(response.status).toBe(409);
  });
});
