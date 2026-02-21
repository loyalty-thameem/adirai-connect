import { Schema, model } from 'mongoose';
import type { ModerationStatus } from './admin.types.js';

const postSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    content: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['thought', 'announcement', 'help', 'complaint', 'service', 'lost_found', 'business'],
      default: 'thought',
      index: true,
    },
    media: [{ type: String }],
    locationTag: { type: String },
    isAnonymous: { type: Boolean, default: false },
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    reportsCount: { type: Number, default: 0 },
    urgentVotes: { type: Number, default: 0 },
    importantVotes: { type: Number, default: 0 },
    moderationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'auto_flagged'] satisfies ModerationStatus[],
      default: 'approved',
      index: true,
    },
  },
  { timestamps: true },
);

export const PostModel = model('Post', postSchema);

