import type { Complaint, Contact, Event, FeedPost, Group, Listing, Poll, Suggestions } from './types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api/v1';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }
  return (await response.json()) as T;
}

export const webApi = {
  getFeed: (area?: string) =>
    request<{ items: FeedPost[] }>(`/community/feed${area ? `?area=${encodeURIComponent(area)}` : ''}`),
  createPost: (payload: Record<string, unknown>) =>
    request<FeedPost>('/community/posts', { method: 'POST', body: JSON.stringify(payload) }),
  reactPost: (postId: string, userId: string, action: 'like' | 'comment' | 'report') =>
    request<FeedPost>(`/community/posts/${postId}/react`, {
      method: 'POST',
      body: JSON.stringify({ userId, action }),
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
    request<Complaint>('/community/complaints', { method: 'POST', body: JSON.stringify(payload) }),
  getMyComplaints: (userId: string) => request<{ items: Complaint[] }>(`/community/complaints/me?userId=${userId}`),

  createListing: (payload: Record<string, unknown>) =>
    request<Listing>('/community/listings', { method: 'POST', body: JSON.stringify(payload) }),
  getListings: (type?: string) =>
    request<{ items: Listing[] }>(`/community/listings${type ? `?type=${encodeURIComponent(type)}` : ''}`),

  createEvent: (payload: Record<string, unknown>) =>
    request<Event>('/community/events', { method: 'POST', body: JSON.stringify(payload) }),
  getEvents: () => request<{ items: Event[] }>('/community/events'),

  getContacts: () => request<{ items: Contact[] }>('/community/contacts'),
  seedContacts: () => request<Record<string, unknown>>('/community/contacts/seed', { method: 'POST' }),

  createPoll: (payload: Record<string, unknown>) =>
    request<Poll>('/community/polls', { method: 'POST', body: JSON.stringify(payload) }),
  getPolls: () => request<{ items: Poll[] }>('/community/polls'),
  votePoll: (payload: Record<string, unknown>) =>
    request<Poll>('/community/polls/vote', { method: 'POST', body: JSON.stringify(payload) }),

  createGroup: (payload: Record<string, unknown>) =>
    request<Group>('/community/groups', { method: 'POST', body: JSON.stringify(payload) }),
  getGroups: () => request<{ items: Group[] }>('/community/groups'),

  getSuggestions: (area: string) =>
    request<Suggestions>(`/community/suggestions?area=${encodeURIComponent(area)}`),
};
