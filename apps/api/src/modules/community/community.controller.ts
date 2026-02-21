import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { ComplaintModel } from '../admin/complaint.model.js';
import { GroupModel } from '../admin/group.model.js';
import { PostModel } from '../admin/post.model.js';
import { UserModel } from '../users/user.model.js';
import { ContactModel } from './contact.model.js';
import { EventModel } from './event.model.js';
import { ListingModel } from './listing.model.js';
import { PollModel } from './poll.model.js';
import { PollVoteModel } from './poll-vote.model.js';
import {
  createComplaintSchema,
  createEventSchema,
  createGroupSchema,
  createListingSchema,
  createPollSchema,
  createPostSchema,
  postReactSchema,
  votePollSchema,
} from './community.schema.js';

function recencyWeight(createdAt: Date): number {
  const ageHours = Math.max(1, (Date.now() - createdAt.getTime()) / (1000 * 3600));
  return Math.round(100 / ageHours);
}

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
  const filter: Record<string, unknown> = { moderationStatus: { $ne: 'rejected' } };
  if (area) {
    filter.locationTag = area;
  }

  const posts = await PostModel.find(filter).sort({ createdAt: -1 }).limit(120).lean();
  const scored = posts
    .map((post) => {
      const score =
        post.likesCount * 2 +
        post.commentsCount * 3 +
        post.importantVotes * 5 +
        post.urgentVotes * 10 +
        recencyWeight(post.createdAt);
      return { ...post, score };
    })
    .sort((a, b) => b.score - a.score);

  res.json({ items: scored });
}

export async function createPost(req: Request, res: Response): Promise<void> {
  const payload = createPostSchema.parse(req.body);
  const userRef = await resolveUserRef(payload.userId);
  if (!userRef) {
    res.status(400).json({ message: 'Invalid userId/mobile' });
    return;
  }
  const post = await PostModel.create({ ...payload, userId: userRef });
  res.status(201).json(post);
}

export async function reactPost(req: Request, res: Response): Promise<void> {
  const payload = postReactSchema.parse(req.body);
  const post = await PostModel.findById(req.params.postId);
  if (!post) {
    res.status(404).json({ message: 'Post not found' });
    return;
  }

  if (payload.action === 'like') post.likesCount += 1;
  if (payload.action === 'comment') post.commentsCount += 1;
  if (payload.action === 'report') post.reportsCount += 1;
  await post.save();

  res.json(post);
}

export async function markUrgent(req: Request, res: Response): Promise<void> {
  const post = await PostModel.findById(req.params.postId);
  if (!post) {
    res.status(404).json({ message: 'Post not found' });
    return;
  }
  post.urgentVotes += 1;
  await post.save();

  let suggestedTo = 0;
  if (post.urgentVotes === 1) suggestedTo = 30;
  if (post.urgentVotes === 10) suggestedTo = 300;

  res.json({
    postId: post.id,
    urgentVotes: post.urgentVotes,
    suggestedTo,
    scope: suggestedTo ? 'area_then_nearby' : 'none',
  });
}

export async function markImportant(req: Request, res: Response): Promise<void> {
  const post = await PostModel.findById(req.params.postId);
  if (!post) {
    res.status(404).json({ message: 'Post not found' });
    return;
  }
  post.importantVotes += 1;
  await post.save();

  res.json({
    postId: post.id,
    importantVotes: post.importantVotes,
    pinnedUntil: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    topPlacement: post.importantVotes >= 10,
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

export function isValidObjectId(id: string): boolean {
  return mongoose.isValidObjectId(id);
}
