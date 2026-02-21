import { z } from 'zod';

export const usersListQuerySchema = z.object({
  q: z.string().optional(),
  role: z.enum(['super_admin', 'admin', 'moderator', 'user', 'business_user']).optional(),
  status: z.enum(['active', 'blocked', 'suspended', 'deleted']).optional(),
  area: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const userStatusSchema = z.object({
  status: z.enum(['active', 'blocked', 'suspended', 'deleted']),
  suspendedUntil: z.string().datetime().optional(),
});

export const userVerifySchema = z.object({
  verifiedBadge: z.boolean(),
});

export const groupStateSchema = z.object({
  isMuted: z.boolean().optional(),
  isFrozen: z.boolean().optional(),
});

export const complaintUpdateSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'resolved']).optional(),
  assignedDepartment: z.string().max(120).optional(),
  note: z.string().max(500).optional(),
});

export const moderationFlagSchema = z.object({
  targetType: z.enum(['post', 'comment', 'user']),
  targetId: z.string().min(1),
  reason: z.string().min(3).max(500),
  severity: z.enum(['low', 'medium', 'high']).default('medium'),
  aiToxicityScore: z.number().min(0).max(1).optional(),
  fakeNewsScore: z.number().min(0).max(1).optional(),
});

export const moderationResolveSchema = z.object({
  resolved: z.boolean(),
  resolvedNote: z.string().max(500).optional(),
});

export const moderationSettingsSchema = z.object({
  aiToxicityEnabled: z.boolean().optional(),
  fakeNewsDetectionEnabled: z.boolean().optional(),
  autoModerationEnabled: z.boolean().optional(),
  shadowBanEnabled: z.boolean().optional(),
  keywordBlacklist: z.array(z.string().min(1)).optional(),
});

export const keywordSchema = z.object({
  keyword: z.string().min(1).max(60),
});

export const messageSchema = z.object({
  channels: z.array(z.enum(['in_app', 'email', 'whatsapp'])).min(1),
  title: z.string().min(3).max(120),
  body: z.string().min(3).max(2000),
});

export const personalMessageSchema = messageSchema.extend({
  userId: z.string().min(8),
});

export const bulkMessageSchema = messageSchema.extend({
  userIds: z.array(z.string().min(8)).min(1).max(1000),
});

export const broadcastMessageSchema = messageSchema.extend({
  area: z.string().optional(),
  role: z.enum(['super_admin', 'admin', 'moderator', 'user', 'business_user']).optional(),
  activeOnly: z.boolean().default(false),
  verifiedOnly: z.boolean().default(false),
});

