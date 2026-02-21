/* eslint-disable no-console */
import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { ComplaintModel } from '../src/modules/admin/complaint.model.js';
import { GroupModel } from '../src/modules/admin/group.model.js';
import { ModerationFlagModel } from '../src/modules/admin/moderation-flag.model.js';
import { PostModel } from '../src/modules/admin/post.model.js';
import { SecurityEventModel } from '../src/modules/admin/security-event.model.js';
import { ContactModel } from '../src/modules/community/contact.model.js';
import { EventModel } from '../src/modules/community/event.model.js';
import { ListingModel } from '../src/modules/community/listing.model.js';
import { MobileTelemetryModel } from '../src/modules/community/mobile-telemetry.model.js';
import { PostSignalModel } from '../src/modules/community/post-signal.model.js';
import { PollModel } from '../src/modules/community/poll.model.js';
import { UserModel } from '../src/modules/users/user.model.js';

async function seed(): Promise<void> {
  await mongoose.connect(env.MONGO_URI);

  await UserModel.deleteMany({ mobile: { $in: ['9000000001', '9000000002'] } });
  await PostModel.deleteMany({});
  await ComplaintModel.deleteMany({});
  await GroupModel.deleteMany({});
  await ModerationFlagModel.deleteMany({});
  await SecurityEventModel.deleteMany({});
  await ListingModel.deleteMany({});
  await EventModel.deleteMany({});
  await ContactModel.deleteMany({});
  await PollModel.deleteMany({});
  await PostSignalModel.deleteMany({});
  await MobileTelemetryModel.deleteMany({});

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

  await ListingModel.insertMany([
    {
      userId: demoUser._id,
      type: 'job',
      title: 'Sales Executive Needed',
      description: 'Local store looking for full-time sales executive.',
      area: 'Adirai East',
      contactName: 'Basha Stores',
      contactPhone: '9000000002',
      priceLabel: 'Salary: 15k/month',
    },
    {
      userId: demoUser._id,
      type: 'business',
      title: 'Fresh Fish Market Offer',
      description: 'Weekend special discount for local residents.',
      area: 'Adirai East',
      contactName: 'Sea Foods Hub',
      contactPhone: '9000000002',
    },
  ]);

  await EventModel.insertMany([
    {
      title: 'Local Sports Tournament',
      description: 'Ward-level football tournament this Sunday.',
      category: 'sports',
      eventDate: new Date(Date.now() + 4 * 24 * 3600 * 1000),
      area: 'Adirai East',
      venue: 'Municipal Ground',
      createdBy: adminUser._id,
    },
    {
      title: 'School Annual Day',
      description: 'Parents and students invited.',
      category: 'school',
      eventDate: new Date(Date.now() + 8 * 24 * 3600 * 1000),
      area: 'Adirai East',
      venue: 'Adirai Public School',
      createdBy: adminUser._id,
    },
  ]);

  await ContactModel.insertMany([
    { type: 'ambulance', name: 'Adirai Ambulance', phone: '108', area: 'Adirai East', available24x7: true },
    { type: 'police', name: 'Adirai Police', phone: '100', area: 'Adirai East', available24x7: true },
    { type: 'doctor', name: 'Dr. Fathima', phone: '9876501234', area: 'Adirai East' },
    { type: 'blood_donor', name: 'A+ Donor Group', phone: '9345609876', area: 'Adirai East', available24x7: true },
  ]);

  await PollModel.create({
    question: 'Which issue should be prioritized this week?',
    options: [
      { id: 'opt_1', label: 'Water', votes: 0 },
      { id: 'opt_2', label: 'Road', votes: 0 },
      { id: 'opt_3', label: 'Electricity', votes: 0 },
    ],
    area: 'Adirai East',
    endsAt: new Date(Date.now() + 5 * 24 * 3600 * 1000),
    createdBy: adminUser._id,
  });

  await PostSignalModel.insertMany([
    {
      postId: post._id,
      userId: adminUser._id,
      signalType: 'important',
      ipAddress: '127.0.0.2',
      deviceId: 'seed-admin',
      area: 'Adirai East',
      accepted: true,
    },
    {
      postId: post._id,
      userId: demoUser._id,
      signalType: 'urgent',
      ipAddress: '127.0.0.1',
      deviceId: 'seed-user',
      area: 'Adirai East',
      accepted: false,
      rejectedReason: 'self_vote_disallowed',
    },
  ]);

  await MobileTelemetryModel.insertMany([
    {
      userId: demoUser._id,
      sessionId: 'seed-mob-1',
      platform: 'android',
      appVersion: '1.0.0',
      eventType: 'session_start',
      screen: 'auth',
    },
    {
      userId: demoUser._id,
      sessionId: 'seed-mob-1',
      platform: 'android',
      appVersion: '1.0.0',
      eventType: 'screen_view',
      screen: 'feed',
    },
    {
      userId: demoUser._id,
      sessionId: 'seed-mob-1',
      platform: 'android',
      appVersion: '1.0.0',
      eventType: 'session_end',
      screen: 'settings',
      durationSec: 720,
    },
  ]);

  console.log('Seed complete');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
