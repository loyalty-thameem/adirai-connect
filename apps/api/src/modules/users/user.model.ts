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
    area: { type: String, required: true },
    ward: { type: String },
    language: { type: String, default: 'ta' },
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

export const UserModel = model('User', userSchema);

