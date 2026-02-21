import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { ComplaintModel } from '../admin/complaint.model.js';
import { GroupModel } from '../admin/group.model.js';
import { MobileConfigModel } from '../admin/mobile-config.model.js';
import { PostModel } from '../admin/post.model.js';
import { UserModel } from '../users/user.model.js';
import { ContactModel } from './contact.model.js';
import { EventModel } from './event.model.js';
import { getCachedFeed, invalidateFeedCache, setCachedFeed } from './feed-cache.js';
import { calculatePostScore, urgentDeliveryPlan } from './feed-ranking.js';
import { ListingModel } from './listing.model.js';
import { MobileTelemetryModel } from './mobile-telemetry.model.js';
import { PollModel } from './poll.model.js';
import { PollVoteModel } from './poll-vote.model.js';
import { PostSignalModel } from './post-signal.model.js';
import {
  createComplaintSchema,
  createEventSchema,
  createGroupSchema,
  createListingSchema,
  createPollSchema,
  createPostSchema,
  mobileTelemetrySchema,
  postSignalSchema,
  postReactSchema,
  votePollSchema,
} from './community.schema.js';

async function resolveUserRef(input: string): Promise<string | null> {
  if (mongoose.isValidObjectId(input)) {
    return input;
  }
  const byMobile = await UserModel.findOne({ mobile: input }).lean();
  if (byMobile?._id) {
    return String(byMobile._id);
  }
  return null;
}

export async function getFeed(req: Request, res: Response): Promise<void> {
  const area = typeof req.query.area === 'string' ? req.query.area : undefined;
  const cached = getCachedFeed<{ items: Array<Record<string, unknown>> }>(area);
  if (cached) {
    res.json({ ...cached, cache: 'hit' });
    return;
  }

  const filter: Record<string, unknown> = { moderationStatus: { $ne: 'rejected' } };
  if (area) {
    filter.locationTag = area;
  }

  const posts = await PostModel.find(filter).sort({ createdAt: -1 }).limit(120).lean();
  const scored = posts
    .map((post) => {
      const score = calculatePostScore(post);
      const pinned = Boolean(post.importantPinnedUntil && post.importantPinnedUntil > new Date());
      const topPlacement = Boolean(post.topPlacementUntil && post.topPlacementUntil > new Date());
      return { ...post, score, pinned, topPlacement };
    })
    .sort((a, b) => {
      if (a.topPlacement !== b.topPlacement) return Number(b.topPlacement) - Number(a.topPlacement);
      if (a.pinned !== b.pinned) return Number(b.pinned) - Number(a.pinned);
      return b.score - a.score;
    });

  const payload = { items: scored };
  setCachedFeed(area, payload);
  res.json({ ...payload, cache: 'miss' });
}

export async function createPost(req: Request, res: Response): Promise<void> {
  const payload = createPostSchema.parse(req.body);
  const userRef = await resolveUserRef(payload.userId);
  if (!userRef) {
    res.status(400).json({ message: 'Invalid userId/mobile' });
    return;
  }
  const post = await PostModel.create({ ...payload, userId: userRef });
  invalidateFeedCache(payload.locationTag);
  res.status(201).json(post);
}

export async function reactPost(req: Request, res: Response): Promise<void> {
  const payload = postReactSchema.parse(req.body);
  const userRef = await resolveUserRef(payload.userId);
  if (!userRef) {
    res.status(400).json({ message: 'Invalid userId/mobile' });
    return;
  }
  const post = await PostModel.findById(req.params.postId);
  if (!post) {
    res.status(404).json({ message: 'Post not found' });
    return;
  }

  await PostSignalModel.create({
    postId: post.id,
    userId: userRef,
    signalType: payload.action,
    ipAddress: req.ip,
    deviceId: req.header('x-device-id') ?? '',
    area: req.header('x-area') ?? post.locationTag ?? '',
    accepted: true,
  });

  if (payload.action === 'like') post.likesCount += 1;
  if (payload.action === 'comment') post.commentsCount += 1;
  if (payload.action === 'report') post.reportsCount += 1;
  await post.save();
  invalidateFeedCache(post.locationTag ?? undefined);

  res.json(post);
}

async function validateSignalAction(
  postId: string,
  signalType: 'urgent' | 'important',
  userRef: string,
  req: Request,
) {
  const post = await PostModel.findById(postId);
  if (!post) {
    return { error: { code: 404, message: 'Post not found' } } as const;
  }

  if (String(post.userId) === String(userRef)) {
    await PostSignalModel.create({
      postId,
      userId: userRef,
      signalType,
      ipAddress: req.ip,
      deviceId: req.header('x-device-id') ?? '',
      area: req.header('x-area') ?? '',
      accepted: false,
      rejectedReason: 'self_vote_disallowed',
    });
    return { error: { code: 400, message: 'Cannot vote on your own post' } } as const;
  }

  const existingAccepted = await PostSignalModel.findOne({
    postId,
    userId: userRef,
    signalType,
    accepted: true,
  }).lean();
  if (existingAccepted) {
    await PostSignalModel.create({
      postId,
      userId: userRef,
      signalType,
      ipAddress: req.ip,
      deviceId: req.header('x-device-id') ?? '',
      area: req.header('x-area') ?? '',
      accepted: false,
      rejectedReason: 'duplicate_vote',
    });
    return { error: { code: 409, message: `Already marked ${signalType}` } } as const;
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const userWindowCount = await PostSignalModel.countDocuments({
    userId: userRef,
    signalType,
    createdAt: { $gte: oneHourAgo },
    accepted: true,
  });
  if (userWindowCount >= 20) {
    await PostSignalModel.create({
      postId,
      userId: userRef,
      signalType,
      ipAddress: req.ip,
      deviceId: req.header('x-device-id') ?? '',
      area: req.header('x-area') ?? '',
      accepted: false,
      rejectedReason: 'user_rate_limit_exceeded',
    });
    return { error: { code: 429, message: 'Too many actions, retry later' } } as const;
  }

  const ipOrDeviceCount = await PostSignalModel.countDocuments({
    signalType,
    createdAt: { $gte: oneHourAgo },
    accepted: true,
    $or: [{ ipAddress: req.ip }, { deviceId: req.header('x-device-id') ?? '' }],
  });
  if (ipOrDeviceCount >= 60) {
    await PostSignalModel.create({
      postId,
      userId: userRef,
      signalType,
      ipAddress: req.ip,
      deviceId: req.header('x-device-id') ?? '',
      area: req.header('x-area') ?? '',
      accepted: false,
      rejectedReason: 'device_or_ip_rate_limit_exceeded',
    });
    return { error: { code: 429, message: 'Suspicious traffic detected' } } as const;
  }

  return { post } as const;
}

export async function markUrgent(req: Request, res: Response): Promise<void> {
  const payload = postSignalSchema.parse(req.body);
  const userRef = await resolveUserRef(payload.userId);
  if (!userRef) {
    res.status(400).json({ message: 'Invalid userId/mobile' });
    return;
  }

  const validation = await validateSignalAction(req.params.postId, 'urgent', userRef, req);
  if ('error' in validation) {
    res.status(validation.error.code).json({ message: validation.error.message });
    return;
  }
  const post = validation.post;

  const samePostSignalFromIp = await PostSignalModel.countDocuments({
    postId: post.id,
    signalType: 'urgent',
    accepted: true,
    ipAddress: req.ip,
  });
  if (samePostSignalFromIp >= 3) {
    post.suspiciousSignalsCount += 1;
  }

  await PostSignalModel.create({
    postId: post.id,
    userId: userRef,
    signalType: 'urgent',
    ipAddress: req.ip,
    deviceId: req.header('x-device-id') ?? '',
    area: req.header('x-area') ?? post.locationTag ?? '',
    accepted: true,
  });
  post.urgentVotes += 1;
  const deliveryPlan = urgentDeliveryPlan(post.urgentVotes, post.locationTag ?? 'Adirai');
  post.urgentBoostTier = deliveryPlan.tier as 'none' | 'local' | 'nearby' | 'global';
  post.urgentBoostReach = deliveryPlan.reach;
  post.urgentBoostUpdatedAt = new Date();
  await post.save();
  invalidateFeedCache(post.locationTag ?? undefined);

  res.json({
    postId: post.id,
    urgentVotes: post.urgentVotes,
    suggestedTo: deliveryPlan.reach,
    scope: deliveryPlan.tier,
    deliveryPlan,
    antiManipulation: {
      uniquePerUserEnforced: true,
      userRateLimitPerHour: 20,
      ipDeviceRateLimitPerHour: 60,
    },
  });
}

export async function markImportant(req: Request, res: Response): Promise<void> {
  const payload = postSignalSchema.parse(req.body);
  const userRef = await resolveUserRef(payload.userId);
  if (!userRef) {
    res.status(400).json({ message: 'Invalid userId/mobile' });
    return;
  }

  const validation = await validateSignalAction(req.params.postId, 'important', userRef, req);
  if ('error' in validation) {
    res.status(validation.error.code).json({ message: validation.error.message });
    return;
  }
  const post = validation.post;

  await PostSignalModel.create({
    postId: post.id,
    userId: userRef,
    signalType: 'important',
    ipAddress: req.ip,
    deviceId: req.header('x-device-id') ?? '',
    area: req.header('x-area') ?? post.locationTag ?? '',
    accepted: true,
  });

  post.importantVotes += 1;
  post.importantPinnedUntil = new Date(Date.now() + 24 * 3600 * 1000);
  if (post.importantVotes >= 10) {
    post.topPlacementUntil = new Date(Date.now() + 24 * 3600 * 1000);
  }
  await post.save();
  invalidateFeedCache(post.locationTag ?? undefined);

  res.json({
    postId: post.id,
    importantVotes: post.importantVotes,
    pinnedUntil: post.importantPinnedUntil.toISOString(),
    topPlacement: post.importantVotes >= 10,
    antiManipulation: {
      uniquePerUserEnforced: true,
      userRateLimitPerHour: 20,
      ipDeviceRateLimitPerHour: 60,
    },
  });
}

export async function createComplaint(req: Request, res: Response): Promise<void> {
  const payload = createComplaintSchema.parse(req.body);
  const userRef = await resolveUserRef(payload.userId);
  if (!userRef) {
    res.status(400).json({ message: 'Invalid userId/mobile' });
    return;
  }
  const complaint = await ComplaintModel.create({ ...payload, userId: userRef });
  res.status(201).json(complaint);
}

export async function myComplaints(req: Request, res: Response): Promise<void> {
  const userId = typeof req.query.userId === 'string' ? req.query.userId : '';
  if (!userId) {
    res.status(400).json({ message: 'userId query required' });
    return;
  }
  const userRef = await resolveUserRef(userId);
  if (!userRef) {
    res.status(400).json({ message: 'Invalid userId/mobile' });
    return;
  }
  const complaints = await ComplaintModel.find({ userId: userRef }).sort({ createdAt: -1 }).lean();
  res.json({ items: complaints });
}

export async function createListing(req: Request, res: Response): Promise<void> {
  const payload = createListingSchema.parse(req.body);
  const userRef = await resolveUserRef(payload.userId);
  if (!userRef) {
    res.status(400).json({ message: 'Invalid userId/mobile' });
    return;
  }
  const listing = await ListingModel.create({ ...payload, userId: userRef });
  res.status(201).json(listing);
}

export async function listListings(req: Request, res: Response): Promise<void> {
  const type = typeof req.query.type === 'string' ? req.query.type : undefined;
  const area = typeof req.query.area === 'string' ? req.query.area : undefined;
  const filter: Record<string, unknown> = { active: true };
  if (type) filter.type = type;
  if (area) filter.area = area;
  const items = await ListingModel.find(filter).sort({ createdAt: -1 }).limit(200).lean();
  res.json({ items });
}

export async function createEvent(req: Request, res: Response): Promise<void> {
  const payload = createEventSchema.parse(req.body);
  const created = await EventModel.create({ ...payload, eventDate: new Date(payload.eventDate) });
  res.status(201).json(created);
}

export async function listEvents(req: Request, res: Response): Promise<void> {
  const area = typeof req.query.area === 'string' ? req.query.area : undefined;
  const filter: Record<string, unknown> = {};
  if (area) filter.area = area;
  const items = await EventModel.find(filter).sort({ eventDate: 1 }).limit(200).lean();
  res.json({ items });
}

export async function listContacts(req: Request, res: Response): Promise<void> {
  const area = typeof req.query.area === 'string' ? req.query.area : undefined;
  const filter: Record<string, unknown> = {};
  if (area) filter.area = area;
  const items = await ContactModel.find(filter).sort({ type: 1 }).lean();
  res.json({ items });
}

export async function createPoll(req: Request, res: Response): Promise<void> {
  const payload = createPollSchema.parse(req.body);
  let createdBy: string | undefined;
  if (payload.createdBy) {
    const ref = await resolveUserRef(payload.createdBy);
    if (!ref) {
      res.status(400).json({ message: 'Invalid createdBy userId/mobile' });
      return;
    }
    createdBy = ref;
  }
  const options = payload.options.map((option, index) => ({
    id: `opt_${index + 1}`,
    label: option,
    votes: 0,
  }));
  const poll = await PollModel.create({
    question: payload.question,
    options,
    area: payload.area,
    endsAt: new Date(payload.endsAt),
    createdBy,
  });
  res.status(201).json(poll);
}

export async function listPolls(req: Request, res: Response): Promise<void> {
  const area = typeof req.query.area === 'string' ? req.query.area : undefined;
  const filter: Record<string, unknown> = {};
  if (area) filter.area = area;
  const items = await PollModel.find(filter).sort({ createdAt: -1 }).lean();
  res.json({ items });
}

export async function votePoll(req: Request, res: Response): Promise<void> {
  const payload = votePollSchema.parse(req.body);
  const userRef = await resolveUserRef(payload.userId);
  if (!userRef) {
    res.status(400).json({ message: 'Invalid userId/mobile' });
    return;
  }
  const poll = await PollModel.findById(payload.pollId);
  if (!poll) {
    res.status(404).json({ message: 'Poll not found' });
    return;
  }
  if (poll.endsAt < new Date()) {
    res.status(400).json({ message: 'Poll ended' });
    return;
  }

  const voteExists = await PollVoteModel.findOne({ pollId: payload.pollId, userId: userRef }).lean();
  if (voteExists) {
    res.status(409).json({ message: 'User already voted' });
    return;
  }

  const target = poll.options.find((option) => option.id === payload.optionId);
  if (!target) {
    res.status(400).json({ message: 'Invalid option' });
    return;
  }

  target.votes += 1;
  await poll.save();
  await PollVoteModel.create({
    pollId: payload.pollId,
    userId: userRef,
    optionId: payload.optionId,
  });

  res.json(poll);
}

export async function createGroup(req: Request, res: Response): Promise<void> {
  const payload = createGroupSchema.parse(req.body);
  const userRef = await resolveUserRef(payload.userId);
  if (!userRef) {
    res.status(400).json({ message: 'Invalid userId/mobile' });
    return;
  }
  const count = await GroupModel.countDocuments({ creatorId: userRef });
  if (count >= 3) {
    res.status(400).json({ message: 'Max 3 groups allowed per user' });
    return;
  }
  const group = await GroupModel.create({
    creatorId: userRef,
    name: payload.name,
    area: payload.area,
    privacy: payload.privacy,
  });
  res.status(201).json(group);
}

export async function listGroups(req: Request, res: Response): Promise<void> {
  const area = typeof req.query.area === 'string' ? req.query.area : undefined;
  const filter: Record<string, unknown> = {};
  if (area) filter.area = area;
  const items = await GroupModel.find(filter).sort({ membersCount: -1 }).limit(150).lean();
  res.json({ items });
}

export async function getSuggestions(req: Request, res: Response): Promise<void> {
  const area = typeof req.query.area === 'string' ? req.query.area : undefined;
  const filter: Record<string, unknown> = { status: 'active' };
  if (area) filter.area = area;

  const [topUsers, topGroups, topBusinesses] = await Promise.all([
    UserModel.find(filter)
      .sort({ 'analyticsMeta.engagementScore': -1, 'analyticsMeta.timeSpentMinutes': -1 })
      .limit(30)
      .lean(),
    GroupModel.find(area ? { area } : {})
      .sort({ membersCount: -1 })
      .limit(20)
      .lean(),
    ListingModel.find({ type: 'business', ...(area ? { area } : {}) })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean(),
  ]);

  res.json({ nearbyUsers: topUsers, suggestedGroups: topGroups, suggestedBusinesses: topBusinesses });
}

export async function seedContacts(req: Request, res: Response): Promise<void> {
  const area = typeof req.query.area === 'string' ? req.query.area : 'Adirai East';
  const exists = await ContactModel.countDocuments({ area });
  if (exists > 0) {
    res.json({ message: 'Contacts already exist', area });
    return;
  }
  await ContactModel.insertMany([
    { type: 'ambulance', name: 'Adirai Ambulance', phone: '108', area, available24x7: true },
    { type: 'police', name: 'Adirai Police Station', phone: '100', area, available24x7: true },
    { type: 'doctor', name: 'Dr. Rahman Clinic', phone: '9876543210', area, available24x7: false },
    { type: 'blood_donor', name: 'Adirai Blood Network', phone: '9123456789', area, available24x7: true },
  ]);
  res.json({ message: 'Contacts seeded', area });
}

export async function getMobileRuntimeConfig(_req: Request, res: Response): Promise<void> {
  let config = await MobileConfigModel.findOne({ singleton: 'default' }).lean();
  if (!config) {
    config = await MobileConfigModel.create({ singleton: 'default' });
  }
  res.json({
    minAndroidVersion: config.minAndroidVersion,
    minIosVersion: config.minIosVersion,
    maintenanceMode: config.maintenanceMode,
    maintenanceMessage: config.maintenanceMessage,
    forceUpdate: config.forceUpdate,
    pushEnabled: config.pushEnabled,
    apiTimeoutMs: config.apiTimeoutMs,
    releaseChannel: config.releaseChannel,
    featureFlags: config.featureFlags,
  });
}

export async function createMobileTelemetry(req: Request, res: Response): Promise<void> {
  const payload = mobileTelemetrySchema.parse(req.body);
  const userRef = payload.userId ? await resolveUserRef(payload.userId) : null;

  const telemetry = await MobileTelemetryModel.create({
    userId: userRef ?? undefined,
    sessionId: payload.sessionId,
    platform: payload.platform,
    appVersion: payload.appVersion,
    eventType: payload.eventType,
    screen: payload.screen,
    feature: payload.feature,
    durationSec: payload.durationSec ?? 0,
    metadata: payload.metadata,
  });

  if (userRef) {
    const update: Record<string, unknown> = {
      'loginMeta.lastSeenAt': new Date(),
      'loginMeta.isOnline': payload.eventType !== 'session_end',
    };
    if (payload.eventType === 'session_end' && payload.durationSec) {
      const user = await UserModel.findById(userRef);
      if (user) {
        const currentMinutes = user.analyticsMeta?.timeSpentMinutes ?? 0;
        user.analyticsMeta = {
          ...user.analyticsMeta,
          timeSpentMinutes: currentMinutes + payload.durationSec / 60,
        };
        user.loginMeta = {
          ...user.loginMeta,
          lastSeenAt: new Date(),
          isOnline: false,
        };
        await user.save();
      }
    } else {
      await UserModel.findByIdAndUpdate(userRef, { $set: update });
    }
  }

  res.status(201).json({ message: 'Telemetry accepted', id: telemetry.id });
}

export async function getPostSignals(req: Request, res: Response): Promise<void> {
  const postId = req.params.postId;
  if (!mongoose.isValidObjectId(postId)) {
    res.status(400).json({ message: 'Invalid postId' });
    return;
  }
  const [urgentAccepted, importantAccepted, rejected, suspiciousIps] = await Promise.all([
    PostSignalModel.countDocuments({ postId, signalType: 'urgent', accepted: true }),
    PostSignalModel.countDocuments({ postId, signalType: 'important', accepted: true }),
    PostSignalModel.countDocuments({
      postId,
      signalType: { $in: ['urgent', 'important'] },
      accepted: false,
    }),
    PostSignalModel.aggregate([
      { $match: { postId: new mongoose.Types.ObjectId(postId), signalType: { $in: ['urgent', 'important'] } } },
      { $group: { _id: '$ipAddress', count: { $sum: 1 } } },
      { $match: { count: { $gte: 3 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
  ]);

  res.json({
    postId,
    accepted: { urgent: urgentAccepted, important: importantAccepted },
    rejectedSignals: rejected,
    suspiciousIps,
  });
}

export function isValidObjectId(id: string): boolean {
  return mongoose.isValidObjectId(id);
}
