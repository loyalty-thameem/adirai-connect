import { Schema, model } from 'mongoose';
import type { MessageChannel } from './admin.types.js';

const campaignSchema = new Schema(
  {
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    mode: { type: String, enum: ['personal', 'bulk', 'broadcast'], required: true, index: true },
    channels: [{ type: String, enum: ['in_app', 'email', 'whatsapp'] satisfies MessageChannel[] }],
    title: { type: String, required: true },
    body: { type: String, required: true },
    targetUserIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    filters: {
      area: { type: String },
      role: { type: String },
      activeOnly: { type: Boolean },
      verifiedOnly: { type: Boolean },
    },
    status: { type: String, enum: ['queued', 'sent', 'failed'], default: 'queued' },
    deliveryStats: {
      totalTargets: { type: Number, default: 0 },
      sentCount: { type: Number, default: 0 },
      failedCount: { type: Number, default: 0 },
    },
  },
  { timestamps: true },
);

export const MessageCampaignModel = model('MessageCampaign', campaignSchema);

