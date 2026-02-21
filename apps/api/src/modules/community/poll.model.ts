import { Schema, model } from 'mongoose';

const pollSchema = new Schema(
  {
    question: { type: String, required: true, trim: true },
    options: [
      {
        id: { type: String, required: true },
        label: { type: String, required: true },
        votes: { type: Number, default: 0 },
      },
    ],
    area: { type: String, required: true, index: true },
    endsAt: { type: Date, required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

export const PollModel = model('Poll', pollSchema);

