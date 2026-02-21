/* eslint-disable no-console */
import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { ComplaintModel } from '../src/modules/admin/complaint.model.js';
import { GroupModel } from '../src/modules/admin/group.model.js';
import { ModerationFlagModel } from '../src/modules/admin/moderation-flag.model.js';
import { PostModel } from '../src/modules/admin/post.model.js';
import { SecurityEventModel } from '../src/modules/admin/security-event.model.js';
import { UserModel } from '../src/modules/users/user.model.js';

async function seed(): Promise<void> {
  await mongoose.connect(env.MONGO_URI);

  await UserModel.deleteMany({ mobile: { $in: ['9000000001', '9000000002'] } });
  await PostModel.deleteMany({});
  await ComplaintModel.deleteMany({});
  await GroupModel.deleteMany({});
  await ModerationFlagModel.deleteMany({});
  await SecurityEventModel.deleteMany({});

  const users = await UserModel.insertMany([
    {
      name: 'System Admin',
      mobile: '9000000001',
      area: 'Adirai Central',
      role: 'super_admin',
      status: 'active',
      verifiedBadge: true,
      language: 'en',
    },
    {
      name: 'Demo User',
      mobile: '9000000002',
      area: 'Adirai East',
      role: 'user',
      status: 'active',
      language: 'ta',
    },
  ]);

  const adminUser = users[0];
  const demoUser = users[1];
  if (!adminUser || !demoUser) {
    throw new Error('Seed users missing');
  }

  const post = await PostModel.create({
    userId: demoUser._id,
    content: 'Water issue in 3rd street since morning',
    category: 'complaint',
    locationTag: 'Adirai East',
    likesCount: 12,
    commentsCount: 4,
    reportsCount: 1,
    urgentVotes: 3,
    importantVotes: 4,
    moderationStatus: 'approved',
  });

  await ComplaintModel.create({
    userId: demoUser._id,
    postId: post._id,
    title: 'Water supply interruption',
    description: 'No water supply from 8 AM',
    category: 'water',
    area: 'Adirai East',
    status: 'pending',
    proofMedia: [],
  });

  await GroupModel.create({
    name: 'Adirai East Residents',
    creatorId: demoUser._id,
    area: 'Adirai East',
    privacy: 'public',
    membersCount: 55,
  });

  await ModerationFlagModel.create({
    targetType: 'post',
    targetId: String(post._id),
    reason: 'Potential misinformation',
    severity: 'medium',
    aiToxicityScore: 0.12,
    fakeNewsScore: 0.48,
    resolved: false,
  });

  await SecurityEventModel.create({
    eventType: 'suspicious_ip',
    userId: demoUser._id,
    ipAddress: '127.0.0.1',
    riskScore: 62,
    details: { reason: 'Multiple failed logins' },
    resolved: false,
  });

  console.log('Seed complete');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
