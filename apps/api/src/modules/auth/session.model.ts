import { Schema, model } from 'mongoose';

const sessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sessionId: { type: String, required: true, unique: true, index: true },
    refreshTokenHash: { type: String, required: true },
    ipAddress: { type: String },
    userAgent: { type: String },
    deviceId: { type: String },
    deviceType: { type: String },
    os: { type: String },
    appVersion: { type: String },
    loginMethod: { type: String, enum: ['otp', 'password', 'google', 'microsoft'] },
    lastActiveAt: { type: Date },
    revokedAt: { type: Date },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

sessionSchema.index({ userId: 1, revokedAt: 1, createdAt: -1 });
sessionSchema.index({ userId: 1, revokedAt: 1, expiresAt: 1 });

export const SessionModel = model('Session', sessionSchema);
