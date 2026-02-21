import type { Response } from 'express';
import mongoose from 'mongoose';
import type { AuthenticatedRequest } from '../../common/middleware/auth.js';
import { hashPassword } from '../../common/utils/password.js';
import { LoginAuditModel } from '../auth/login-audit.model.js';
import { SessionModel } from '../auth/session.model.js';
import { UserModel } from '../users/user.model.js';
import { ComplaintModel } from './complaint.model.js';
import { GroupModel } from './group.model.js';
import { AuditLogModel } from './audit-log.model.js';
import { MessageCampaignModel } from './message-campaign.model.js';
import { MobileConfigModel } from './mobile-config.model.js';
import { MobileTelemetryModel } from '../community/mobile-telemetry.model.js';
import { ModerationFlagModel } from './moderation-flag.model.js';
import { ModerationSettingsModel } from './moderation-settings.model.js';
import { PostModel } from './post.model.js';
import {
  broadcastMessageSchema,
  bulkMessageSchema,
  complaintUpdateSchema,
  groupStateSchema,
  keywordSchema,
  moderationFlagSchema,
  moderationResolveSchema,
  moderationSettingsSchema,
  mobileConfigSchema,
  personalMessageSchema,
  userStatusSchema,
  userVerifySchema,
  usersListQuerySchema,
} from './admin.schema.js';
import { SecurityEventModel } from './security-event.model.js';

function getAdminId(req: AuthenticatedRequest): string {
  return req.auth?.userId ?? '';
}

export async function dashboardAnalytics(_req: AuthenticatedRequest, res: Response): Promise<void> {
  const since24h = new Date(Date.now() - 24 * 3600 * 1000);
  const [
    totalUsers,
    activeUsers,
    active24h,
    complaintsByCategory,
    complaintByArea,
    featureUsage,
    reportedPosts,
    mobileActiveUsers,
    mobileSessionAvg,
    mobileTopScreens,
  ] = await Promise.all([
    UserModel.countDocuments({ status: { $ne: 'deleted' } }),
    SessionModel.distinct('userId', { revokedAt: { $exists: false } }),
    UserModel.countDocuments({ 'loginMeta.lastSeenAt': { $gte: since24h } }),
    ComplaintModel.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
    ComplaintModel.aggregate([{ $group: { _id: '$area', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 5 }]),
    PostModel.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    PostModel.countDocuments({ reportsCount: { $gt: 0 } }),
    MobileTelemetryModel.distinct('userId', { createdAt: { $gte: since24h }, userId: { $exists: true } }),
    MobileTelemetryModel.aggregate([
      { $match: { createdAt: { $gte: since24h }, eventType: 'session_end', durationSec: { $gt: 0 } } },
      { $group: { _id: null, avgSec: { $avg: '$durationSec' } } },
    ]),
    MobileTelemetryModel.aggregate([
      { $match: { createdAt: { $gte: since24h }, eventType: 'screen_view', screen: { $exists: true, $ne: '' } } },
      { $group: { _id: '$screen', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
  ]);

  const avgSessionMinutes = await UserModel.aggregate([
    { $group: { _id: null, avg: { $avg: '$analyticsMeta.timeSpentMinutes' } } },
  ]);

  res.json({
    totalUsers,
    currentlyLoggedInUsers: activeUsers.length,
    dailyActiveUsers: active24h,
    avgSessionDurationMinutes: Number(avgSessionMinutes[0]?.avg ?? 0),
    mostComplaintCategory: complaintsByCategory,
    mostActiveArea: complaintByArea,
    mostUsedFeature: featureUsage,
    reportedPosts,
    mobile: {
      dailyActiveUsers: mobileActiveUsers.length,
      avgSessionMinutes: Number((mobileSessionAvg[0]?.avgSec ?? 0) / 60),
      topScreens: mobileTopScreens,
    },
  });
}

export async function dashboardSecurity(_req: AuthenticatedRequest, res: Response): Promise<void> {
  const [failedLogins, suspiciousIps, multiAccountRisk, openEvents, recentAuditWrites] = await Promise.all([
    LoginAuditModel.countDocuments({
      event: 'login_failed',
      createdAt: { $gte: new Date(Date.now() - 24 * 3600 * 1000) },
    }),
    LoginAuditModel.aggregate([
      { $match: { event: 'login_failed', ipAddress: { $exists: true, $ne: '' } } },
      { $group: { _id: '$ipAddress', count: { $sum: 1 } } },
      { $match: { count: { $gte: 5 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]),
    SecurityEventModel.countDocuments({ eventType: 'multi_account_risk', resolved: false }),
    SecurityEventModel.find({ resolved: false }).sort({ createdAt: -1 }).limit(50).lean(),
    AuditLogModel.find().sort({ createdAt: -1 }).limit(20).lean(),
  ]);

  res.json({
    failedLoginsLast24h: failedLogins,
    suspiciousIps,
    multiAccountRiskOpen: multiAccountRisk,
    openEvents,
    recentAuditWrites,
  });
}

export async function listAuditLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
  const statusCode = typeof req.query.statusCode === 'string' ? Number(req.query.statusCode) : undefined;
  const method = typeof req.query.method === 'string' ? req.query.method.toUpperCase() : undefined;
  const path = typeof req.query.path === 'string' ? req.query.path : undefined;

  const filter: Record<string, unknown> = {};
  if (Number.isFinite(statusCode)) filter.statusCode = statusCode;
  if (method) filter.method = method;
  if (path) filter.path = { $regex: path, $options: 'i' };

  const logs = await AuditLogModel.find(filter).sort({ createdAt: -1 }).limit(500).lean();
  res.json({ items: logs });
}

export async function listUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
  const query = usersListQuerySchema.parse(req.query);
  const filter: Record<string, unknown> = {};

  if (query.role) filter.role = query.role;
  if (query.status) filter.status = query.status;
  if (query.area) filter.area = query.area;
  if (query.q) {
    filter.$or = [
      { name: { $regex: query.q, $options: 'i' } },
      { mobile: { $regex: query.q, $options: 'i' } },
      { email: { $regex: query.q, $options: 'i' } },
    ];
  }

  const skip = (query.page - 1) * query.pageSize;
  const [items, total] = await Promise.all([
    UserModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.pageSize).lean(),
    UserModel.countDocuments(filter),
  ]);

  res.json({ items, pagination: { page: query.page, pageSize: query.pageSize, total } });
}

export async function getUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = await UserModel.findById(req.params.userId).lean();
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  res.json(user);
}

export async function getUserInsights(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.params.userId;
  const userObjectId = mongoose.isValidObjectId(userId) ? new mongoose.Types.ObjectId(userId) : null;
  const [user, postMix, postTotals, loginEvents, groupsCreated, groupsJoined, complaintCount] =
    await Promise.all([
      UserModel.findById(userId).lean(),
      PostModel.aggregate([
        { $match: { userId: userObjectId } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]),
      PostModel.aggregate([
        { $match: { userId: userObjectId } },
        {
          $group: {
            _id: null,
            likes: { $sum: '$likesCount' },
            comments: { $sum: '$commentsCount' },
            reports: { $sum: '$reportsCount' },
            urgent: { $sum: '$urgentVotes' },
            important: { $sum: '$importantVotes' },
          },
        },
      ]),
      LoginAuditModel.find({ userId }).sort({ createdAt: -1 }).limit(20).lean(),
      GroupModel.countDocuments({ creatorId: userId }),
      Promise.resolve(0),
      ComplaintModel.countDocuments({ userId }),
    ]);

  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  res.json({
    user,
    postingCategories: postMix,
    behavior: postTotals[0] ?? { likes: 0, comments: 0, reports: 0, urgent: 0, important: 0 },
    recentLoginActivity: loginEvents,
    groupsCreated,
    groupsJoined,
    complaintCount,
    profileType: user.profileType,
    engagement: {
      sessionDurationAvgSec: user.analyticsMeta?.sessionDurationAvgSec ?? 0,
      timeSpentMinutes: user.analyticsMeta?.timeSpentMinutes ?? 0,
      activeHours: user.analyticsMeta?.activeHours ?? [],
      engagementScore: user.analyticsMeta?.engagementScore ?? 0,
    },
  });
}

export async function updateUserStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  const payload = userStatusSchema.parse(req.body);
  const update: Record<string, unknown> = { status: payload.status };
  if (payload.suspendedUntil) {
    update.suspendedUntil = new Date(payload.suspendedUntil);
  }

  const user = await UserModel.findByIdAndUpdate(req.params.userId, { $set: update }, { new: true }).lean();
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  res.json(user);
}

export async function updateUserVerification(req: AuthenticatedRequest, res: Response): Promise<void> {
  const payload = userVerifySchema.parse(req.body);
  const user = await UserModel.findByIdAndUpdate(
    req.params.userId,
    { $set: { verifiedBadge: payload.verifiedBadge } },
    { new: true },
  ).lean();
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  res.json(user);
}

export async function softDeleteUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = await UserModel.findByIdAndUpdate(
    req.params.userId,
    { $set: { status: 'deleted' } },
    { new: true },
  ).lean();
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  res.json({ message: 'User soft deleted', user });
}

export async function permanentDeleteUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = await UserModel.findByIdAndDelete(req.params.userId).lean();
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  await SessionModel.deleteMany({ userId: req.params.userId });
  res.json({ message: 'User permanently deleted' });
}

export async function resetUserPasswordByAdmin(req: AuthenticatedRequest, res: Response): Promise<void> {
  const temporaryPassword = `Tmp#${Math.random().toString().slice(2, 10)}`;
  const user = await UserModel.findByIdAndUpdate(
    req.params.userId,
    { $set: { passwordHash: hashPassword(temporaryPassword) } },
    { new: true },
  ).lean();
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  await SessionModel.updateMany({ userId: user._id, revokedAt: { $exists: false } }, { revokedAt: new Date() });
  res.json({ message: 'Password reset and sessions revoked', temporaryPassword });
}

export async function forceLogoutByAdmin(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = await UserModel.findById(req.params.userId);
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  await SessionModel.updateMany({ userId: user.id, revokedAt: { $exists: false } }, { revokedAt: new Date() });
  user.loginMeta = {
    ...user.loginMeta,
    isOnline: false,
    forceLogoutAt: new Date(),
    lastSeenAt: new Date(),
  };
  await user.save();
  res.json({ message: 'User force logged out', userId: user.id });
}

export async function listComplaints(req: AuthenticatedRequest, res: Response): Promise<void> {
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const area = typeof req.query.area === 'string' ? req.query.area : undefined;
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (area) filter.area = area;
  const complaints = await ComplaintModel.find(filter).sort({ createdAt: -1 }).limit(200).lean();
  res.json({ items: complaints });
}

export async function updateComplaint(req: AuthenticatedRequest, res: Response): Promise<void> {
  const payload = complaintUpdateSchema.parse(req.body);
  const complaint = await ComplaintModel.findById(req.params.complaintId);
  if (!complaint) {
    res.status(404).json({ message: 'Complaint not found' });
    return;
  }
  if (payload.status) complaint.status = payload.status;
  if (payload.assignedDepartment) complaint.assignedDepartment = payload.assignedDepartment;
  complaint.statusHistory.push({
    status: payload.status ?? complaint.status,
    byAdminId: getAdminId(req),
    note: payload.note,
    createdAt: new Date(),
  });
  await complaint.save();
  res.json(complaint);
}

export async function listModerationFlags(_req: AuthenticatedRequest, res: Response): Promise<void> {
  const flags = await ModerationFlagModel.find().sort({ createdAt: -1 }).limit(200).lean();
  res.json({ items: flags });
}

export async function createModerationFlag(req: AuthenticatedRequest, res: Response): Promise<void> {
  const payload = moderationFlagSchema.parse(req.body);
  const created = await ModerationFlagModel.create(payload);
  res.status(201).json(created);
}

export async function resolveModerationFlag(req: AuthenticatedRequest, res: Response): Promise<void> {
  const payload = moderationResolveSchema.parse(req.body);
  const flag = await ModerationFlagModel.findByIdAndUpdate(
    req.params.flagId,
    {
      $set: {
        resolved: payload.resolved,
        resolvedNote: payload.resolvedNote,
        resolvedBy: getAdminId(req),
      },
    },
    { new: true },
  ).lean();
  if (!flag) {
    res.status(404).json({ message: 'Flag not found' });
    return;
  }
  res.json(flag);
}

export async function getModerationSettings(_req: AuthenticatedRequest, res: Response): Promise<void> {
  let settings = await ModerationSettingsModel.findOne({ singleton: 'default' }).lean();
  if (!settings) {
    settings = await ModerationSettingsModel.create({ singleton: 'default' });
  }
  res.json(settings);
}

export async function updateModerationSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
  const payload = moderationSettingsSchema.parse(req.body);
  const settings = await ModerationSettingsModel.findOneAndUpdate(
    { singleton: 'default' },
    { $set: payload, $setOnInsert: { singleton: 'default' } },
    { upsert: true, new: true },
  ).lean();
  res.json(settings);
}

export async function addKeyword(req: AuthenticatedRequest, res: Response): Promise<void> {
  const payload = keywordSchema.parse(req.body);
  const settings = await ModerationSettingsModel.findOneAndUpdate(
    { singleton: 'default' },
    { $addToSet: { keywordBlacklist: payload.keyword }, $setOnInsert: { singleton: 'default' } },
    { upsert: true, new: true },
  ).lean();
  res.json(settings);
}

async function campaignTargetsCount(payload: { userIds?: string[]; area?: string; role?: string; activeOnly?: boolean; verifiedOnly?: boolean; }) {
  if (payload.userIds) return payload.userIds.length;
  const filter: Record<string, unknown> = {};
  if (payload.area) filter.area = payload.area;
  if (payload.role) filter.role = payload.role;
  if (payload.activeOnly) filter.status = 'active';
  if (payload.verifiedOnly) filter.verifiedBadge = true;
  return UserModel.countDocuments(filter);
}

export async function sendPersonalMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
  const payload = personalMessageSchema.parse(req.body);
  const campaign = await MessageCampaignModel.create({
    createdBy: getAdminId(req),
    mode: 'personal',
    channels: payload.channels,
    title: payload.title,
    body: payload.body,
    targetUserIds: [payload.userId],
    status: 'sent',
    deliveryStats: { totalTargets: 1, sentCount: 1, failedCount: 0 },
  });
  res.status(201).json(campaign);
}

export async function sendBulkMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
  const payload = bulkMessageSchema.parse(req.body);
  const campaign = await MessageCampaignModel.create({
    createdBy: getAdminId(req),
    mode: 'bulk',
    channels: payload.channels,
    title: payload.title,
    body: payload.body,
    targetUserIds: payload.userIds,
    status: 'sent',
    deliveryStats: { totalTargets: payload.userIds.length, sentCount: payload.userIds.length, failedCount: 0 },
  });
  res.status(201).json(campaign);
}

export async function sendBroadcastMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
  const payload = broadcastMessageSchema.parse(req.body);
  const totalTargets = await campaignTargetsCount(payload);
  const campaign = await MessageCampaignModel.create({
    createdBy: getAdminId(req),
    mode: 'broadcast',
    channels: payload.channels,
    title: payload.title,
    body: payload.body,
    filters: {
      area: payload.area,
      role: payload.role,
      activeOnly: payload.activeOnly,
      verifiedOnly: payload.verifiedOnly,
    },
    status: 'sent',
    deliveryStats: { totalTargets, sentCount: totalTargets, failedCount: 0 },
  });
  res.status(201).json(campaign);
}

export async function listCampaigns(_req: AuthenticatedRequest, res: Response): Promise<void> {
  const campaigns = await MessageCampaignModel.find().sort({ createdAt: -1 }).limit(100).lean();
  res.json({ items: campaigns });
}

export async function listGroups(req: AuthenticatedRequest, res: Response): Promise<void> {
  const area = typeof req.query.area === 'string' ? req.query.area : undefined;
  const filter: Record<string, unknown> = {};
  if (area) filter.area = area;
  const groups = await GroupModel.find(filter).sort({ createdAt: -1 }).limit(200).lean();
  res.json({ items: groups });
}

export async function updateGroupState(req: AuthenticatedRequest, res: Response): Promise<void> {
  const payload = groupStateSchema.parse(req.body);
  const group = await GroupModel.findByIdAndUpdate(req.params.groupId, { $set: payload }, { new: true }).lean();
  if (!group) {
    res.status(404).json({ message: 'Group not found' });
    return;
  }
  res.json(group);
}

export async function removeGroup(req: AuthenticatedRequest, res: Response): Promise<void> {
  const group = await GroupModel.findByIdAndDelete(req.params.groupId).lean();
  if (!group) {
    res.status(404).json({ message: 'Group not found' });
    return;
  }
  res.json({ message: 'Group removed' });
}

export async function getMobileConfig(_req: AuthenticatedRequest, res: Response): Promise<void> {
  let config = await MobileConfigModel.findOne({ singleton: 'default' }).lean();
  if (!config) {
    config = await MobileConfigModel.create({ singleton: 'default' });
  }
  res.json(config);
}

export async function updateMobileConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
  const payload = mobileConfigSchema.parse(req.body);
  const config = await MobileConfigModel.findOneAndUpdate(
    { singleton: 'default' },
    { $set: payload, $setOnInsert: { singleton: 'default' } },
    { upsert: true, new: true },
  ).lean();
  res.json(config);
}
