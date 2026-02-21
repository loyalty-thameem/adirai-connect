import { Platform } from 'react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api/v1';

type RequestOptions = RequestInit & {
  accessToken?: string;
};

function deviceHeaders() {
  return {
    'x-device-type': 'mobile',
    'x-device-id': `mobile-${Platform.OS}-sim`,
    'x-device-os': Platform.OS,
    'x-app-version': '1.0.0',
  };
}

async function request<T>(path: string, options?: RequestOptions): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...deviceHeaders(),
      ...(options?.accessToken ? { Authorization: `Bearer ${options.accessToken}` } : {}),
      ...(options?.headers ?? {}),
    },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }
  return (await response.json()) as T;
}

export const mobileApi = {
  requestOtp: (mobile: string) =>
    request<{ otpDevOnly: string; expiresInSec: number }>('/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify({ mobile, purpose: 'login' }),
    }),
  verifyOtpLogin: (mobile: string, otp: string) =>
    request<{ accessToken: string; refreshToken: string }>('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ mobile, otp, purpose: 'login' }),
    }),
  passwordLogin: (mobile: string, password: string) =>
    request<{ accessToken: string; refreshToken: string }>('/auth/login/password', {
      method: 'POST',
      body: JSON.stringify({ mobile, password }),
    }),
  getFeed: (area: string) => request<{ items: Array<Record<string, unknown>> }>(`/community/feed?area=${encodeURIComponent(area)}`),
  createPost: (payload: Record<string, unknown>) =>
    request<Record<string, unknown>>('/community/posts', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  reactPost: (postId: string, payload: { userId: string; action: 'like' | 'comment' | 'report' }) =>
    request<Record<string, unknown>>(`/community/posts/${postId}/react`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  urgentPost: (postId: string, userId: string) =>
    request<Record<string, unknown>>(`/community/posts/${postId}/urgent`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),
  importantPost: (postId: string, userId: string) =>
    request<Record<string, unknown>>(`/community/posts/${postId}/important`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),
  createComplaint: (payload: Record<string, unknown>) =>
    request<Record<string, unknown>>('/community/complaints', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  myComplaints: (userId: string) =>
    request<{ items: Array<Record<string, unknown>> }>(`/community/complaints/me?userId=${encodeURIComponent(userId)}`),
  getMobileRuntimeConfig: () =>
    request<Record<string, unknown>>('/community/mobile-config'),
  sendTelemetry: (payload: Record<string, unknown>) =>
    request<{ message: string }>('/community/mobile/telemetry', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

