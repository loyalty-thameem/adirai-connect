import { z } from 'zod';

export const createPostSchema = z.object({
  userId: z.string().min(8),
  content: z.string().min(3).max(2000),
  category: z
    .enum(['thought', 'announcement', 'help', 'complaint', 'service', 'lost_found', 'business'])
    .default('thought'),
  media: z.array(z.string().url()).max(6).optional(),
  locationTag: z.string().max(120).optional(),
  isAnonymous: z.boolean().default(false),
});

export const postReactSchema = z.object({
  action: z.enum(['like', 'comment', 'report']),
  userId: z.string().min(8),
});

export const postSignalSchema = z.object({
  userId: z.string().min(8),
});

export const createComplaintSchema = z.object({
  userId: z.string().min(8),
  title: z.string().min(3).max(150),
  description: z.string().min(3).max(2000),
  category: z.enum(['water', 'road', 'electricity', 'garbage', 'drainage', 'other']).default('other'),
  area: z.string().min(2).max(100),
  ward: z.string().max(100).optional(),
  proofMedia: z.array(z.string().url()).max(6).optional(),
});

export const createListingSchema = z.object({
  userId: z.string().min(8),
  type: z.enum(['job', 'business', 'offer', 'freelancer', 'rental', 'vehicle']),
  title: z.string().min(3).max(150),
  description: z.string().min(3).max(1500),
  area: z.string().min(2).max(100),
  contactName: z.string().max(120).optional(),
  contactPhone: z.string().max(20).optional(),
  priceLabel: z.string().max(80).optional(),
});

export const createEventSchema = z.object({
  title: z.string().min(3).max(150),
  description: z.string().min(3).max(1500),
  category: z.enum(['marriage', 'religious', 'sports', 'school', 'announcement']).default('announcement'),
  eventDate: z.string().datetime(),
  area: z.string().min(2).max(100),
  venue: z.string().max(150).optional(),
  createdBy: z.string().min(8).optional(),
});

export const createPollSchema = z.object({
  question: z.string().min(3).max(300),
  options: z.array(z.string().min(1).max(120)).min(2).max(6),
  area: z.string().min(2).max(100),
  endsAt: z.string().datetime(),
  createdBy: z.string().min(8).optional(),
});

export const votePollSchema = z.object({
  pollId: z.string().min(8),
  userId: z.string().min(8),
  optionId: z.string().min(1),
});

export const createGroupSchema = z.object({
  userId: z.string().min(8),
  name: z.string().min(3).max(120),
  area: z.string().min(2).max(100),
  privacy: z.enum(['public', 'private', 'invite_only']).default('public'),
});

export const mobileTelemetrySchema = z.object({
  userId: z.string().min(8).optional(),
  sessionId: z.string().min(6).max(80),
  platform: z.enum(['android', 'ios']),
  appVersion: z.string().min(1).max(30),
  eventType: z.enum(['session_start', 'session_end', 'screen_view', 'action']),
  screen: z.string().max(80).optional(),
  feature: z.string().max(80).optional(),
  durationSec: z.number().int().min(0).max(86400).optional(),
  metadata: z.record(z.unknown()).optional(),
});
