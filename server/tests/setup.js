import { beforeAll, afterAll } from 'vitest';

import { prisma } from '../src/db/prisma.js';

if (process.env.NODE_ENV !== 'test') {
  throw new Error('Tests must run with NODE_ENV=test.');
}

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});
