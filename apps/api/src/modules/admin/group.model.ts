import { Schema, model } from 'mongoose';

const groupSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    area: { type: String, required: true, index: true },
    privacy: { type: String, enum: ['public', 'private', 'invite_only'], default: 'public' },
    membersCount: { type: Number, default: 1 },
    isMuted: { type: Boolean, default: false },
    isFrozen: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const GroupModel = model('Group', groupSchema);

