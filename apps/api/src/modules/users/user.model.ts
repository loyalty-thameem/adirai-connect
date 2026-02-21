import { Schema, model } from 'mongoose';

export type UserStatus = 'active' | 'blocked' | 'suspended' | 'deleted';
export type UserRole = 'super_admin' | 'admin' | 'moderator' | 'user' | 'business_user';

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, unique: true, index: true },
    email: { type: String, lowercase: true, trim: true, sparse: true },
    passwordHash: { type: String },
    role: {
      type: String,
      enum: ['super_admin', 'admin', 'moderator', 'user', 'business_user'],
      default: 'user',
    },
    status: {
      type: String,
      enum: ['active', 'blocked', 'suspended', 'deleted'],
      default: 'active',
    },
    verifiedBadge: { type: Boolean, default: false },
    aadhaarVerified: { type: Boolean, default: false },
    shadowBanned: { type: Boolean, default: false },
    suspendedUntil: { type: Date },
    profileType: {
      type: String,
      enum: ['general', 'business', 'volunteer', 'government'],
      default: 'general',
    },
    area: { type: String, required: true },
    ward: { type: String },
    language: { type: String, default: 'ta' },
    privacy: {
      termsAcceptedAt: { type: Date },
      privacyAcceptedAt: { type: Date },
      dataProcessingConsentAt: { type: Date },
      marketingOptIn: { type: Boolean, default: false },
    },
    loginMeta: {
      lastLoginAt: { type: Date },
      lastSeenAt: { type: Date },
      isOnline: { type: Boolean, default: false },
      failedLoginCount: { type: Number, default: 0 },
      lockUntil: { type: Date },
      forceLogoutAt: { type: Date },
    },
    analyticsMeta: {
      sessionDurationAvgSec: { type: Number, default: 0 },
      engagementScore: { type: Number, default: 0 },
      urgentPostsCount: { type: Number, default: 0 },
      importantPostsCount: { type: Number, default: 0 },
      complaintCount: { type: Number, default: 0 },
      reportCount: { type: Number, default: 0 },
      timeSpentMinutes: { type: Number, default: 0 },
      activeHours: [{ type: Number }],
      sentimentScore: { type: Number, default: 0 },
      postCategoryAffinity: {
        complaint: { type: Number, default: 0 },
        business: { type: Number, default: 0 },
        help: { type: Number, default: 0 },
        general: { type: Number, default: 0 },
      },
    },
    oauth: {
      google: {
        providerId: { type: String },
        emailVerified: { type: Boolean },
      },
      microsoft: {
        providerId: { type: String },
        emailVerified: { type: Boolean },
      },
    },
  },
  { timestamps: true },
);

userSchema.index({ status: 1, area: 1, createdAt: -1 });
userSchema.index({ area: 1, 'analyticsMeta.engagementScore': -1, 'analyticsMeta.timeSpentMinutes': -1 });

export const UserModel = model('User', userSchema);
