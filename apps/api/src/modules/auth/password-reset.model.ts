import { Schema, model } from 'mongoose';

const passwordResetSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    consumedAt: { type: Date },
  },
  { timestamps: true },
);

export const PasswordResetModel = model('PasswordReset', passwordResetSchema);

