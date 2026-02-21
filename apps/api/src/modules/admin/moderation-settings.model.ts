import { Schema, model } from 'mongoose';

const moderationSettingsSchema = new Schema(
  {
    singleton: { type: String, unique: true, default: 'default' },
    aiToxicityEnabled: { type: Boolean, default: true },
    fakeNewsDetectionEnabled: { type: Boolean, default: true },
    autoModerationEnabled: { type: Boolean, default: true },
    shadowBanEnabled: { type: Boolean, default: true },
    keywordBlacklist: [{ type: String }],
  },
  { timestamps: true },
);

export const ModerationSettingsModel = model('ModerationSettings', moderationSettingsSchema);

