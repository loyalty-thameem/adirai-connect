import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2).max(120),
  mobile: z.string().min(8).max(20),
  area: z.string().min(2).max(100),
  ward: z.string().max(100).optional(),
  language: z.enum(['ta', 'en', 'ar']).default('ta'),
  email: z.string().email().optional(),
  password: z.string().min(8).max(72).optional(),
  consent: z
    .object({
      termsAccepted: z.boolean(),
      privacyAccepted: z.boolean(),
      dataProcessingAccepted: z.boolean(),
      marketingOptIn: z.boolean().optional(),
    })
    .optional(),
});

export const otpRequestSchema = z.object({
  mobile: z.string().min(8).max(20),
  purpose: z.enum(['register', 'login', 'password_reset']).default('login'),
});

export const forgotPasswordRequestSchema = z.object({
  mobile: z.string().min(8).max(20),
});

export const otpVerifySchema = z.object({
  mobile: z.string().min(8).max(20),
  otp: z.string().length(6),
  purpose: z.enum(['register', 'login', 'password_reset']).default('login'),
});

export const passwordLoginSchema = z.object({
  mobile: z.string().min(8).max(20),
  password: z.string().min(8).max(72),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(20),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(20).optional(),
});

export const resetPasswordSchema = z.object({
  resetToken: z.string().min(20),
  newPassword: z.string().min(8).max(72),
});

export const forceLogoutSchema = z.object({
  userId: z.string().min(8),
});

export const oauthLoginSchema = z.object({
  provider: z.enum(['google', 'microsoft']),
  providerId: z.string().min(3),
  email: z.string().email(),
  emailVerified: z.boolean().default(true),
  name: z.string().min(2).max(120),
  mobile: z.string().min(8).max(20).optional(),
  area: z.string().min(2).max(100).optional(),
  ward: z.string().max(100).optional(),
  language: z.enum(['ta', 'en', 'ar']).default('ta'),
});

export const privacyConsentSchema = z.object({
  termsAccepted: z.boolean().optional(),
  privacyAccepted: z.boolean().optional(),
  dataProcessingAccepted: z.boolean().optional(),
  marketingOptIn: z.boolean().optional(),
});
