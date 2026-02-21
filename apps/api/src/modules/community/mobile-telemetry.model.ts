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

mobileTelemetrySchema.index({ createdAt: -1, eventType: 1 });
mobileTelemetrySchema.index({ eventType: 1, createdAt: -1, screen: 1 });
mobileTelemetrySchema.index({ userId: 1, createdAt: -1 });

export const MobileTelemetryModel = model('MobileTelemetry', mobileTelemetrySchema);
