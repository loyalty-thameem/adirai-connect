import { Schema, model } from 'mongoose';

const mobileTelemetrySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    sessionId: { type: String, required: true, index: true },
    platform: { type: String, enum: ['android', 'ios'], required: true, index: true },
    appVersion: { type: String, required: true },
    eventType: {
      type: String,
      enum: ['session_start', 'session_end', 'screen_view', 'action'],
      required: true,
      index: true,
    },
    screen: { type: String, index: true },
    feature: { type: String, index: true },
    durationSec: { type: Number, default: 0 },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

export const MobileTelemetryModel = model('MobileTelemetry', mobileTelemetrySchema);

