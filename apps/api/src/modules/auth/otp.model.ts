import { Schema, model } from 'mongoose';

const otpCodeSchema = new Schema(
  {
    mobile: { type: String, required: true, index: true },
    purpose: {
      type: String,
      enum: ['register', 'login', 'password_reset'],
      required: true,
      index: true,
    },
    otpHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true, index: true },
    usedAt: { type: Date },
    requestedIp: { type: String },
  },
  { timestamps: true },
);

export const OtpCodeModel = model('OtpCode', otpCodeSchema);

