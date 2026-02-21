import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../common/middleware/auth.js';
import { hashPassword, verifyPassword } from '../../common/utils/password.js';
import { UserModel } from '../users/user.model.js';
import { enqueueLoginAudit } from '../../common/background/write-queue.js';
import {
  forceLogoutSchema,
  forgotPasswordRequestSchema,
  logoutSchema,
  oauthLoginSchema,
  otpRequestSchema,
  otpVerifySchema,
  passwordLoginSchema,
  refreshTokenSchema,
  registerSchema,
  resetPasswordSchema,
  privacyConsentSchema,
} from './auth.schema.js';
import {
  createAccessToken,
  createRefreshToken,
  generateOtpCode,
  hashToken,
  newSessionId,
  verifyRefreshToken,
} from './auth.service.js';
import { LoginAuditModel } from './login-audit.model.js';
import { OtpCodeModel } from './otp.model.js';
import { PasswordResetModel } from './password-reset.model.js';
import { SessionModel } from './session.model.js';

function getClientMeta(req: AuthenticatedRequest) {
  return {
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'] ?? '',
    deviceId: req.header('x-device-id') ?? '',
    deviceType: req.header('x-device-type') ?? 'web',
    os: req.header('x-device-os') ?? '',
    appVersion: req.header('x-app-version') ?? '',
  };
}

async function audit(
  userId: string,
  event: 'login_success' | 'login_failed' | 'logout' | 'force_logout' | 'refresh',
  req: AuthenticatedRequest,
  loginMethod?: 'otp' | 'password' | 'google' | 'microsoft',
): Promise<void> {
  await enqueueLoginAudit({
    userId,
    event,
    loginMethod,
    ...getClientMeta(req),
  });
}

async function issueSessionTokens(
  userId: string,
  role: string,
  loginMethod: 'otp' | 'password' | 'google' | 'microsoft',
  req: AuthenticatedRequest,
) {
  const sessionId = newSessionId();
  const payload = { sub: userId, role, sessionId };
  const accessToken = createAccessToken(payload);
  const refreshToken = createRefreshToken(payload);
  await SessionModel.create({
    userId,
    sessionId,
    refreshTokenHash: hashToken(refreshToken),
    ...getClientMeta(req),
    loginMethod,
    expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
  });
  return { sessionId, accessToken, refreshToken };
}

export async function register(req: AuthenticatedRequest, res: Response): Promise<void> {
  const data = registerSchema.parse(req.body);
  const { consent, password, ...rest } = data;
  const existing = await UserModel.findOne({ mobile: data.mobile }).lean();
  if (existing) {
    res.status(409).json({ message: 'Mobile already registered' });
    return;
  }

  const user = await UserModel.create({
    ...rest,
    passwordHash: password ? hashPassword(password) : undefined,
    privacy: consent
      ? {
          termsAcceptedAt: consent.termsAccepted ? new Date() : undefined,
          privacyAcceptedAt: consent.privacyAccepted ? new Date() : undefined,
          dataProcessingConsentAt: consent.dataProcessingAccepted ? new Date() : undefined,
          marketingOptIn: consent.marketingOptIn ?? false,
        }
      : undefined,
    status: 'active',
    role: 'user',
  });

  res.status(201).json({ message: 'Registered', userId: user.id });
}

export async function requestOtp(req: AuthenticatedRequest, res: Response): Promise<void> {
  const data = otpRequestSchema.parse(req.body);
  const otp = generateOtpCode();
  await OtpCodeModel.create({
    mobile: data.mobile,
    purpose: data.purpose,
    otpHash: hashToken(`${data.mobile}:${data.purpose}:${otp}`),
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    requestedIp: req.ip,
  });

  res.json({
    message: 'OTP generated',
    mobile: data.mobile,
    purpose: data.purpose,
    expiresInSec: 300,
    otpDevOnly: otp,
  });
}

export async function requestPasswordResetOtp(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const data = forgotPasswordRequestSchema.parse(req.body);
  const user = await UserModel.findOne({ mobile: data.mobile }).lean();
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  const otp = generateOtpCode();
  await OtpCodeModel.create({
    mobile: data.mobile,
    purpose: 'password_reset',
    otpHash: hashToken(`${data.mobile}:password_reset:${otp}`),
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    requestedIp: req.ip,
  });

  res.json({
    message: 'Password reset OTP generated',
    mobile: data.mobile,
    purpose: 'password_reset',
    expiresInSec: 300,
    otpDevOnly: otp,
  });
}

async function verifyOtpCore(mobile: string, otp: string, purpose: 'register' | 'login' | 'password_reset') {
  const otpDoc = await OtpCodeModel.findOne({
    mobile,
    purpose,
    usedAt: { $exists: false },
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  if (!otpDoc) {
    return false;
  }

  const provided = hashToken(`${mobile}:${purpose}:${otp}`);
  if (otpDoc.otpHash !== provided) {
    otpDoc.attempts += 1;
    await otpDoc.save();
    return false;
  }

  otpDoc.usedAt = new Date();
  await otpDoc.save();
  return true;
}

export async function verifyOtpLogin(req: AuthenticatedRequest, res: Response): Promise<void> {
  const data = otpVerifySchema.parse(req.body);
  const validOtp = await verifyOtpCore(data.mobile, data.otp, data.purpose);
  if (!validOtp) {
    res.status(400).json({ message: 'Invalid OTP' });
    return;
  }

  if (data.purpose === 'password_reset') {
    const user = await UserModel.findOne({ mobile: data.mobile });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    const token = newSessionId();
    await PasswordResetModel.create({
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });
    res.json({ message: 'OTP verified for password reset', resetToken: token });
    return;
  }

  const user = await UserModel.findOne({ mobile: data.mobile });
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  const { sessionId, accessToken, refreshToken } = await issueSessionTokens(
    user.id,
    user.role,
    'otp',
    req,
  );

  user.set('loginMeta.isOnline', true);
  user.set('loginMeta.lastLoginAt', new Date());
  user.set('loginMeta.lastSeenAt', new Date());
  user.set('loginMeta.failedLoginCount', 0);
  await user.save();
  await audit(user.id, 'login_success', req, 'otp');

  res.json({ sessionId, accessToken, refreshToken });
}

export async function loginWithPassword(req: AuthenticatedRequest, res: Response): Promise<void> {
  const data = passwordLoginSchema.parse(req.body);
  const user = await UserModel.findOne({ mobile: data.mobile });
  if (!user || !user.passwordHash || !verifyPassword(data.password, user.passwordHash)) {
    if (user) {
      const failedLoginCount = (user.loginMeta?.failedLoginCount ?? 0) + 1;
      user.set('loginMeta.failedLoginCount', failedLoginCount);
      await user.save();
      await audit(user.id, 'login_failed', req, 'password');
    }
    res.status(401).json({ message: 'Invalid credentials' });
    return;
  }

  const { sessionId, accessToken, refreshToken } = await issueSessionTokens(
    user.id,
    user.role,
    'password',
    req,
  );

  user.set('loginMeta.isOnline', true);
  user.set('loginMeta.lastLoginAt', new Date());
  user.set('loginMeta.lastSeenAt', new Date());
  user.set('loginMeta.failedLoginCount', 0);
  await user.save();
  await audit(user.id, 'login_success', req, 'password');

  res.json({ sessionId, accessToken, refreshToken });
}

export async function oauthLogin(req: AuthenticatedRequest, res: Response): Promise<void> {
  const data = oauthLoginSchema.parse(req.body);

  let user = await UserModel.findOne({
    $or: [{ email: data.email }, { [`oauth.${data.provider}.providerId`]: data.providerId }],
  });

  if (!user) {
    user = await UserModel.create({
      name: data.name,
      email: data.email,
      mobile: data.mobile ?? `oauth_${data.provider}_${data.providerId}`,
      area: data.area ?? 'Adirai',
      ward: data.ward,
      language: data.language,
      status: 'active',
      role: 'user',
      oauth: {
        [data.provider]: {
          providerId: data.providerId,
          emailVerified: data.emailVerified,
        },
      },
    });
  } else {
    user.set(`oauth.${data.provider}.providerId`, data.providerId);
    user.set(`oauth.${data.provider}.emailVerified`, data.emailVerified);
    await user.save();
  }

  const method = data.provider === 'google' ? 'google' : 'microsoft';
  const { sessionId, accessToken, refreshToken } = await issueSessionTokens(
    user.id,
    user.role,
    method,
    req,
  );
  user.set('loginMeta.isOnline', true);
  user.set('loginMeta.lastLoginAt', new Date());
  user.set('loginMeta.lastSeenAt', new Date());
  user.set('loginMeta.failedLoginCount', user.loginMeta?.failedLoginCount ?? 0);
  await user.save();
  await audit(user.id, 'login_success', req, method);

  res.json({ sessionId, accessToken, refreshToken });
}

export async function refreshSession(req: AuthenticatedRequest, res: Response): Promise<void> {
  const data = refreshTokenSchema.parse(req.body);
  const payload = verifyRefreshToken(data.refreshToken);
  if (!payload) {
    res.status(401).json({ message: 'Invalid refresh token' });
    return;
  }

  const session = await SessionModel.findOne({ sessionId: payload.sessionId });
  if (!session || session.revokedAt || session.expiresAt < new Date()) {
    res.status(401).json({ message: 'Session expired or revoked' });
    return;
  }

  const incomingHash = hashToken(data.refreshToken);
  if (incomingHash !== session.refreshTokenHash) {
    res.status(401).json({ message: 'Refresh token mismatch' });
    return;
  }

  const nextPayload = { sub: payload.sub, role: payload.role, sessionId: payload.sessionId };
  const nextAccessToken = createAccessToken(nextPayload);
  const nextRefreshToken = createRefreshToken(nextPayload);
  session.refreshTokenHash = hashToken(nextRefreshToken);
  session.lastActiveAt = new Date();
  await session.save();

  await UserModel.findByIdAndUpdate(payload.sub, {
    $set: {
      'loginMeta.lastSeenAt': new Date(),
      'loginMeta.isOnline': true,
    },
  });
  await audit(payload.sub, 'refresh', req);

  res.json({
    sessionId: payload.sessionId,
    accessToken: nextAccessToken,
    refreshToken: nextRefreshToken,
  });
}

export async function logout(req: AuthenticatedRequest, res: Response): Promise<void> {
  const data = logoutSchema.parse(req.body ?? {});
  let sessionId: string | undefined;
  let userId: string | undefined;

  if (data.refreshToken) {
    const payload = verifyRefreshToken(data.refreshToken);
    if (payload) {
      sessionId = payload.sessionId;
      userId = payload.sub;
    }
  }

  if (!sessionId && req.auth?.sessionId) {
    sessionId = req.auth.sessionId;
    userId = req.auth.userId;
  }

  if (!sessionId) {
    res.status(400).json({ message: 'Session reference not provided' });
    return;
  }

  await SessionModel.findOneAndUpdate({ sessionId }, { revokedAt: new Date() });

  if (userId) {
    await UserModel.findByIdAndUpdate(userId, {
      $set: {
        'loginMeta.isOnline': false,
        'loginMeta.lastSeenAt': new Date(),
      },
    });
    await audit(userId, 'logout', req);
  }

  res.json({ message: 'Logged out' });
}

export async function logoutAllSessions(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.auth?.userId;
  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const result = await SessionModel.updateMany(
    { userId, revokedAt: { $exists: false } },
    { revokedAt: new Date() },
  );

  await UserModel.findByIdAndUpdate(userId, {
    $set: {
      'loginMeta.isOnline': false,
      'loginMeta.lastSeenAt': new Date(),
    },
  });
  await audit(userId, 'logout', req);

  res.json({
    message: 'All sessions logged out',
    revokedSessions: result.modifiedCount,
  });
}

export async function resetPassword(req: AuthenticatedRequest, res: Response): Promise<void> {
  const data = resetPasswordSchema.parse(req.body);
  const resetRequest = await PasswordResetModel.findOne({
    tokenHash: hashToken(data.resetToken),
    consumedAt: { $exists: false },
    expiresAt: { $gt: new Date() },
  });
  if (!resetRequest) {
    res.status(400).json({ message: 'Invalid or expired reset token' });
    return;
  }

  const user = await UserModel.findById(resetRequest.userId);
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  user.passwordHash = hashPassword(data.newPassword);
  user.set('loginMeta.failedLoginCount', 0);
  await user.save();
  resetRequest.consumedAt = new Date();
  await resetRequest.save();
  await SessionModel.updateMany({ userId: user.id, revokedAt: { $exists: false } }, { revokedAt: new Date() });

  res.json({ message: 'Password reset successful, all sessions revoked' });
}

export async function forceLogoutUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  const data = forceLogoutSchema.parse(req.body);
  const target = await UserModel.findById(data.userId);
  if (!target) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  await SessionModel.updateMany(
    { userId: target.id, revokedAt: { $exists: false } },
    { revokedAt: new Date() },
  );
  target.set('loginMeta.isOnline', false);
  target.set('loginMeta.forceLogoutAt', new Date());
  target.set('loginMeta.lastSeenAt', new Date());
  target.set('loginMeta.failedLoginCount', target.loginMeta?.failedLoginCount ?? 0);
  await target.save();
  await audit(target.id, 'force_logout', req);

  res.json({ message: 'User force logged out', userId: target.id });
}

export async function mySessionHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.auth?.userId;
  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const sessions = await SessionModel.find({ userId }).sort({ createdAt: -1 }).limit(50).lean();
  const audits = await LoginAuditModel.find({ userId }).sort({ createdAt: -1 }).limit(100).lean();

  res.json({ sessions, audits });
}

export async function userSessionHistoryForAdmin(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const userId = req.params.userId;
  const sessions = await SessionModel.find({ userId }).sort({ createdAt: -1 }).limit(50).lean();
  const audits = await LoginAuditModel.find({ userId }).sort({ createdAt: -1 }).limit(100).lean();
  res.json({ sessions, audits });
}

export async function updatePrivacyConsent(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.auth?.userId;
  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const payload = privacyConsentSchema.parse(req.body);
  const setValues: Record<string, unknown> = {};
  if (payload.termsAccepted !== undefined) {
    setValues['privacy.termsAcceptedAt'] = payload.termsAccepted ? new Date() : null;
  }
  if (payload.privacyAccepted !== undefined) {
    setValues['privacy.privacyAcceptedAt'] = payload.privacyAccepted ? new Date() : null;
  }
  if (payload.dataProcessingAccepted !== undefined) {
    setValues['privacy.dataProcessingConsentAt'] = payload.dataProcessingAccepted ? new Date() : null;
  }
  if (payload.marketingOptIn !== undefined) {
    setValues['privacy.marketingOptIn'] = payload.marketingOptIn;
  }

  const user = await UserModel.findByIdAndUpdate(userId, { $set: setValues }, { new: true }).lean();
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  res.json({ message: 'Privacy preferences updated', privacy: user.privacy });
}
