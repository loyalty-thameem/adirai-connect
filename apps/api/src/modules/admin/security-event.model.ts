import { Schema, model } from 'mongoose';

const securityEventSchema = new Schema(
  {
    eventType: {
      type: String,
      enum: ['failed_login_spike', 'suspicious_ip', 'multi_account_risk', 'spam_risk'],
      required: true,
      index: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    ipAddress: { type: String, index: true },
    riskScore: { type: Number, default: 0 },
    details: { type: Schema.Types.Mixed },
    resolved: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

export const SecurityEventModel = model('SecurityEvent', securityEventSchema);

