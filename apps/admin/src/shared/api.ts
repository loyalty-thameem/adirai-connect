import type { AdminUser, Campaign, Complaint, Group, ModerationFlag } from './types';

const BASE_URL = import.meta.env.VITE_ADMIN_API_BASE_URL ?? 'http://localhost:4000/api/v1';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem('admin_access_token') ?? '';
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }
  return (await response.json()) as T;
}

export const adminApi = {
  getAnalytics: () => request<Record<string, unknown>>('/admin/dashboard/analytics'),
  getSecurity: () => request<Record<string, unknown>>('/admin/dashboard/security'),
  listUsers: (query = '') => request<{ items: AdminUser[] }>(`/admin/users${query ? `?${query}` : ''}`),
  getUserInsights: (userId: string) => request<Record<string, unknown>>(`/admin/users/${userId}/insights`),
  updateUserStatus: (userId: string, payload: { status: string; suspendedUntil?: string }) =>
    request<AdminUser>(`/admin/users/${userId}/status`, { method: 'PATCH', body: JSON.stringify(payload) }),
  verifyUser: (userId: string, verifiedBadge: boolean) =>
    request<AdminUser>(`/admin/users/${userId}/verify`, { method: 'PATCH', body: JSON.stringify({ verifiedBadge }) }),
  forceLogoutUser: (userId: string) =>
    request<{ message: string }>(`/admin/users/${userId}/force-logout`, { method: 'POST' }),
  softDeleteUser: (userId: string) =>
    request<{ message: string }>(`/admin/users/${userId}`, { method: 'DELETE' }),
  permanentDeleteUser: (userId: string) =>
    request<{ message: string }>(`/admin/users/${userId}/permanent`, { method: 'DELETE' }),
  listComplaints: () => request<{ items: Complaint[] }>('/admin/complaints'),
  updateComplaint: (complaintId: string, payload: Record<string, unknown>) =>
    request<Complaint>(`/admin/complaints/${complaintId}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  listModerationFlags: () => request<{ items: ModerationFlag[] }>('/admin/moderation/flags'),
  createModerationFlag: (payload: Record<string, unknown>) =>
    request<ModerationFlag>('/admin/moderation/flags', { method: 'POST', body: JSON.stringify(payload) }),
  resolveModerationFlag: (flagId: string, payload: Record<string, unknown>) =>
    request<ModerationFlag>(`/admin/moderation/flags/${flagId}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  getModerationSettings: () => request<Record<string, unknown>>('/admin/moderation/settings'),
  updateModerationSettings: (payload: Record<string, unknown>) =>
    request<Record<string, unknown>>('/admin/moderation/settings', { method: 'PATCH', body: JSON.stringify(payload) }),
  addKeyword: (keyword: string) =>
    request<Record<string, unknown>>('/admin/moderation/keywords', { method: 'POST', body: JSON.stringify({ keyword }) }),
  sendPersonalMessage: (payload: Record<string, unknown>) =>
    request<Record<string, unknown>>('/admin/messaging/personal', { method: 'POST', body: JSON.stringify(payload) }),
  sendBulkMessage: (payload: Record<string, unknown>) =>
    request<Record<string, unknown>>('/admin/messaging/bulk', { method: 'POST', body: JSON.stringify(payload) }),
  sendBroadcastMessage: (payload: Record<string, unknown>) =>
    request<Record<string, unknown>>('/admin/messaging/broadcast', { method: 'POST', body: JSON.stringify(payload) }),
  listCampaigns: () => request<{ items: Campaign[] }>('/admin/messaging/campaigns'),
  listGroups: () => request<{ items: Group[] }>('/admin/groups'),
  updateGroupState: (groupId: string, payload: Record<string, unknown>) =>
    request<Group>(`/admin/groups/${groupId}/state`, { method: 'PATCH', body: JSON.stringify(payload) }),
  removeGroup: (groupId: string) =>
    request<{ message: string }>(`/admin/groups/${groupId}`, { method: 'DELETE' }),
};

