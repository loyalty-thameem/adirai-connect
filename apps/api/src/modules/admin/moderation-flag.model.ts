import { Schema, model } from 'mongoose';

const moderationFlagSchema = new Schema(
  {
    targetType: { type: String, enum: ['post', 'comment', 'user'], required: true, index: true },
    targetId: { type: String, required: true, index: true },
    reason: { type: String, required: true },
    severity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium', index: true },
    aiToxicityScore: { type: Number, default: 0 },
    fakeNewsScore: { type: Number, default: 0 },
    resolved: { type: Boolean, default: false, index: true },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    resolvedNote: { type: String },
  },
  { timestamps: true },
);

export const ModerationFlagModel = model('ModerationFlag', moderationFlagSchema);

