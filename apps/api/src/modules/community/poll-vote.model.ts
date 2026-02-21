import { Schema, model } from 'mongoose';

const pollVoteSchema = new Schema(
  {
    pollId: { type: Schema.Types.ObjectId, ref: 'Poll', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    optionId: { type: String, required: true },
  },
  { timestamps: true },
);

pollVoteSchema.index({ pollId: 1, userId: 1 }, { unique: true });

export const PollVoteModel = model('PollVote', pollVoteSchema);

