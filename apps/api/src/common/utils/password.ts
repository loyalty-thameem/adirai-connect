import crypto from 'crypto';

const ITERATIONS = 120000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex');
  return `${ITERATIONS}:${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [iterationsRaw, salt, originalHash] = storedHash.split(':');
  if (!iterationsRaw || !salt || !originalHash) {
    return false;
  }

  const iterations = Number(iterationsRaw);
  if (!Number.isInteger(iterations) || iterations < 1) {
    return false;
  }

  const derived = crypto.pbkdf2Sync(password, salt, iterations, KEY_LENGTH, DIGEST).toString('hex');
  const a = Buffer.from(originalHash, 'hex');
  const b = Buffer.from(derived, 'hex');
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}

