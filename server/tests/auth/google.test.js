import request from 'supertest';
import { describe, expect, it } from 'vitest';

import app from '../../src/app.js';

describe('Google OAuth', () => {
  it('redirects to Google from the OAuth login endpoint', async () => {
    const response = await request(app).get('/auth/google');

    expect(response.status).toBe(302);
    expect(response.headers.location).toContain('accounts.google.com');
  });
});
