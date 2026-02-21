import { Schema, model } from 'mongoose';

const eventSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['marriage', 'religious', 'sports', 'school', 'announcement'],
      default: 'announcement',
      index: true,
    },
    eventDate: { type: Date, required: true, index: true },
    area: { type: String, required: true, index: true },
    venue: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

export const EventModel = model('Event', eventSchema);

