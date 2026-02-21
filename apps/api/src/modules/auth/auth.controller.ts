import type { Request, Response } from 'express';
import { UserModel } from '../users/user.model.js';
import {
  otpRequestSchema,
  otpVerifySchema,
  passwordLoginSchema,
  registerSchema,
} from './auth.schema.js';
import { createAccessToken, createRefreshToken, hashToken, newSessionId } from './auth.service.js';
import { SessionModel } from './session.model.js';

function getClientMeta(req: Request) {
  return {
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'] ?? '',
    deviceId: req.header('x-device-id') ?? '',
    deviceType: req.header('x-device-type') ?? 'web',
    os: req.header('x-device-os') ?? '',
    appVersion: req.header('x-app-version') ?? '',
  };
}

export async function register(req: Request, res: Response): Promise<void> {
  const data = registerSchema.parse(req.body);
  const existing = await UserModel.findOne({ mobile: data.mobile }).lean();
  if (existing) {
    res.status(409).json({ message: 'Mobile already registered' });
    return;
  }

  const user = await UserModel.create({
    ...data,
    status: 'active',
    role: 'user',
  });

  res.status(201).json({ message: 'Registered', userId: user.id });
}

export async function requestOtp(req: Request, res: Response): Promise<void> {
  const data = otpRequestSchema.parse(req.body);
  res.json({
    message: 'OTP generated (stub)',
    mobile: data.mobile,
    expiresInSec: 300,
  });
}

export async function verifyOtpLogin(req: Request, res: Response): Promise<void> {
  const data = otpVerifySchema.parse(req.body);
  const user = await UserModel.findOne({ mobile: data.mobile });
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  const sessionId = newSessionId();
  const payload = { sub: user.id, role: user.role, sessionId };
  const accessToken = createAccessToken(payload);
  const refreshToken = createRefreshToken(payload);

  await SessionModel.create({
    userId: user.id,
    sessionId,
    refreshTokenHash: hashToken(refreshToken),
    ...getClientMeta(req),
    loginMethod: 'otp',
    expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
  });

  user.loginMeta = {
    ...user.loginMeta,
    isOnline: true,
    lastLoginAt: new Date(),
    lastSeenAt: new Date(),
    failedLoginCount: 0,
  };
  await user.save();

  res.json({ accessToken, refreshToken });
}

export async function loginWithPassword(req: Request, res: Response): Promise<void> {
  const data = passwordLoginSchema.parse(req.body);
  const user = await UserModel.findOne({ mobile: data.mobile });
  if (!user) {
    res.status(401).json({ message: 'Invalid credentials' });
    return;
  }

  const sessionId = newSessionId();
  const payload = { sub: user.id, role: user.role, sessionId };
  const accessToken = createAccessToken(payload);
  const refreshToken = createRefreshToken(payload);

  await SessionModel.create({
    userId: user.id,
    sessionId,
    refreshTokenHash: hashToken(refreshToken),
    ...getClientMeta(req),
    loginMethod: 'password',
    expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
  });

  user.loginMeta = {
    ...user.loginMeta,
    isOnline: true,
    lastLoginAt: new Date(),
    lastSeenAt: new Date(),
  };
  await user.save();

  res.json({ accessToken, refreshToken });
}

export async function oauthCallback(_req: Request, res: Response): Promise<void> {
  res.json({
    message: 'OAuth callback stub. Integrate Passport/OIDC in Step 2.',
    providers: ['google', 'microsoft'],
  });
}

