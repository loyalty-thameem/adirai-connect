import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2).max(120),
  mobile: z.string().min(8).max(20),
  area: z.string().min(2).max(100),
  ward: z.string().max(100).optional(),
  language: z.enum(['ta', 'en', 'ar']).default('ta'),
  email: z.string().email().optional(),
  password: z.string().min(8).max(72).optional(),
});

export const otpRequestSchema = z.object({
  mobile: z.string().min(8).max(20),
  purpose: z.enum(['register', 'login', 'password_reset']).default('login'),
});

export const otpVerifySchema = z.object({
  mobile: z.string().min(8).max(20),
  otp: z.string().length(6),
});

export const passwordLoginSchema = z.object({
  mobile: z.string().min(8).max(20),
  password: z.string().min(8).max(72),
});

