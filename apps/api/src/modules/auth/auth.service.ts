import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';

type JwtPayload = {
  sub: string;
  role: string;
  sessionId: string;
};

export function createAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.ACCESS_TOKEN_TTL });
}

export function createRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.REFRESH_TOKEN_TTL });
}

export function hashToken(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function newSessionId(): string {
  return crypto.randomUUID();
}

