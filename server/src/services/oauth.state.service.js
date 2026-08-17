import crypto from 'node:crypto';

export function generateOAuthState() {
  return crypto.randomBytes(32).toString('hex');
}

export function verifyOAuthState(expectedState, receivedState) {
  if (!expectedState || !receivedState) {
    return false;
  }

  const expectedBuffer = Buffer.from(expectedState);
  const receivedBuffer = Buffer.from(receivedState);

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}
