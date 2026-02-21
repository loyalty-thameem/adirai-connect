import { Schema, model } from 'mongoose';

const auditLogSchema = new Schema(
  {
    actorUserId: { type: String, index: true },
    method: { type: String, required: true },
    path: { type: String, required: true, index: true },
    statusCode: { type: Number, required: true, index: true },
    ipAddress: { type: String, index: true },
    userAgent: { type: String },
    requestId: { type: String, index: true },
    durationMs: { type: Number },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

export const AuditLogModel = model('AuditLog', auditLogSchema);

