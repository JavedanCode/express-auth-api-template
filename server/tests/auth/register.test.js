import bcrypt from 'bcryptjs';
import request from 'supertest';

import { prisma } from '../../src/db/prisma.js';
import app from '../../src/app.js';

describe('POST /auth/register', () => {
  afterEach(async () => {
    await prisma.user.deleteMany();
  });

  it('registers a new user', async () => {
    const response = await request(app).post('/auth/register').send({
      username: 'testuser',
      email: 'test@example.com',
      password: 'StrongPassword123!',
    });

    expect(response.status).toBe(201);

    expect(response.body).toMatchObject({
      success: true,
      message: 'Registration successful.',
      user: {
        username: 'testuser',
        email: 'test@example.com',
        displayName: null,
        avatarUrl: null,
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
    expect(user.passwordHash).not.toBe('StrongPassword123!');

    const passwordMatches = await bcrypt.compare('StrongPassword123!', user.passwordHash);

    expect(passwordMatches).toBe(true);
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

    expect(response.status).toBe(500);
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

    expect(response.status).toBe(500);
  });
});
