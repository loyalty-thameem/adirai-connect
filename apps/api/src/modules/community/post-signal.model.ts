import { Schema, model } from 'mongoose';

const postSignalSchema = new Schema(
  {
    postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    signalType: {
      type: String,
      enum: ['urgent', 'important', 'like', 'comment', 'report'],
      required: true,
      index: true,
    },
    ipAddress: { type: String },
    deviceId: { type: String },
    area: { type: String },
    accepted: { type: Boolean, default: true, index: true },
    rejectedReason: { type: String },
  },
  { timestamps: true },
);

postSignalSchema.index(
  { postId: 1, userId: 1, signalType: 1, accepted: 1 },
  { unique: true, partialFilterExpression: { accepted: true } },
);
postSignalSchema.index({ userId: 1, signalType: 1, accepted: 1, createdAt: -1 });
postSignalSchema.index({ signalType: 1, accepted: 1, createdAt: -1, ipAddress: 1 });
postSignalSchema.index({ signalType: 1, accepted: 1, createdAt: -1, deviceId: 1 });
postSignalSchema.index({ postId: 1, signalType: 1, accepted: 1, ipAddress: 1 });
postSignalSchema.index({ postId: 1, signalType: 1, accepted: 1, createdAt: -1 });

export const PostSignalModel = model('PostSignal', postSignalSchema);
