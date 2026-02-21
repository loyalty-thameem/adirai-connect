import { Schema, model } from 'mongoose';
import type { ComplaintStatus } from './admin.types.js';

const complaintSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    postId: { type: Schema.Types.ObjectId, ref: 'Post' },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['water', 'road', 'electricity', 'garbage', 'drainage', 'other'],
      default: 'other',
      index: true,
    },
    area: { type: String, required: true, index: true },
    ward: { type: String },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'resolved'] satisfies ComplaintStatus[],
      default: 'pending',
      index: true,
    },
    assignedDepartment: { type: String },
    proofMedia: [{ type: String }],
    statusHistory: [
      {
        status: { type: String },
        byAdminId: { type: Schema.Types.ObjectId, ref: 'User' },
        note: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

complaintSchema.index({ status: 1, area: 1, createdAt: -1 });
complaintSchema.index({ userId: 1, createdAt: -1 });

export const ComplaintModel = model('Complaint', complaintSchema);
