import { Schema, model } from 'mongoose';

const loginAuditSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    event: {
      type: String,
      enum: ['login_success', 'login_failed', 'logout', 'force_logout', 'refresh'],
      required: true,
      index: true,
    },
    loginMethod: {
      type: String,
      enum: ['otp', 'password', 'google', 'microsoft'],
    },
    ipAddress: { type: String },
    userAgent: { type: String },
    deviceId: { type: String },
    deviceType: { type: String },
    os: { type: String },
    appVersion: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

loginAuditSchema.index({ userId: 1, createdAt: -1 });
loginAuditSchema.index({ event: 1, createdAt: -1 });
loginAuditSchema.index({ event: 1, ipAddress: 1, createdAt: -1 });

export const LoginAuditModel = model('LoginAudit', loginAuditSchema);
