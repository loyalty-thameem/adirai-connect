import { AuditLogModel } from '../../modules/admin/audit-log.model.js';
import { LoginAuditModel } from '../../modules/auth/login-audit.model.js';
import { MobileTelemetryModel } from '../../modules/community/mobile-telemetry.model.js';
import { env } from '../../config/env.js';

type QueueName = 'auditLog' | 'loginAudit' | 'mobileTelemetry';

type QueueStats = {
  enabled: boolean;
  intervalMs: number;
  batchSize: number;
  maxSize: number;
  inProgress: boolean;
  pending: Record<QueueName, number>;
  flushed: Record<QueueName, number>;
  dropped: Record<QueueName, number>;
  failures: Record<QueueName, number>;
  lastFlushAt?: string;
};

const auditLogQueue: Array<Record<string, unknown>> = [];
const loginAuditQueue: Array<Record<string, unknown>> = [];
const mobileTelemetryQueue: Array<Record<string, unknown>> = [];

const stats: QueueStats = {
  enabled: env.BACKGROUND_QUEUE_ENABLED,
  intervalMs: env.BACKGROUND_QUEUE_FLUSH_INTERVAL_MS,
  batchSize: env.BACKGROUND_QUEUE_BATCH_SIZE,
  maxSize: env.BACKGROUND_QUEUE_MAX_SIZE,
  inProgress: false,
  pending: { auditLog: 0, loginAudit: 0, mobileTelemetry: 0 },
  flushed: { auditLog: 0, loginAudit: 0, mobileTelemetry: 0 },
  dropped: { auditLog: 0, loginAudit: 0, mobileTelemetry: 0 },
  failures: { auditLog: 0, loginAudit: 0, mobileTelemetry: 0 },
};

let flushTimer: ReturnType<typeof setInterval> | undefined;

function updatePending(): void {
  stats.pending.auditLog = auditLogQueue.length;
  stats.pending.loginAudit = loginAuditQueue.length;
  stats.pending.mobileTelemetry = mobileTelemetryQueue.length;
}

function enqueue(queueName: QueueName, payload: Record<string, unknown>): void {
  const target =
    queueName === 'auditLog'
      ? auditLogQueue
      : queueName === 'loginAudit'
        ? loginAuditQueue
        : mobileTelemetryQueue;
  if (target.length >= env.BACKGROUND_QUEUE_MAX_SIZE) {
    stats.dropped[queueName] += 1;
    return;
  }
  target.push(payload);
  updatePending();
}

async function flushBatch(queueName: QueueName): Promise<void> {
  const target =
    queueName === 'auditLog'
      ? auditLogQueue
      : queueName === 'loginAudit'
        ? loginAuditQueue
        : mobileTelemetryQueue;
  if (target.length === 0) {
    return;
  }

  const batch = target.splice(0, env.BACKGROUND_QUEUE_BATCH_SIZE);
  if (batch.length === 0) {
    return;
  }

  try {
    if (queueName === 'auditLog') {
      await AuditLogModel.insertMany(batch, { ordered: false });
    } else if (queueName === 'loginAudit') {
      await LoginAuditModel.insertMany(batch, { ordered: false });
    } else {
      await MobileTelemetryModel.insertMany(batch, { ordered: false });
    }
    stats.flushed[queueName] += batch.length;
  } catch {
    stats.failures[queueName] += 1;
  } finally {
    updatePending();
  }
}

export async function flushBackgroundWriteQueue(): Promise<void> {
  if (!env.BACKGROUND_QUEUE_ENABLED || stats.inProgress) {
    return;
  }

  stats.inProgress = true;
  try {
    await flushBatch('auditLog');
    await flushBatch('loginAudit');
    await flushBatch('mobileTelemetry');
    stats.lastFlushAt = new Date().toISOString();
  } finally {
    stats.inProgress = false;
  }
}

async function flushUntilEmpty(): Promise<void> {
  while (auditLogQueue.length > 0 || loginAuditQueue.length > 0 || mobileTelemetryQueue.length > 0) {
    await flushBackgroundWriteQueue();
  }
}

export function startBackgroundWriteQueue(): void {
  if (!env.BACKGROUND_QUEUE_ENABLED || flushTimer) {
    return;
  }
  flushTimer = setInterval(() => {
    void flushBackgroundWriteQueue();
  }, env.BACKGROUND_QUEUE_FLUSH_INTERVAL_MS);
}

export async function stopBackgroundWriteQueue(): Promise<void> {
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = undefined;
  }
  await flushUntilEmpty();
}

export async function enqueueAuditLog(payload: Record<string, unknown>): Promise<void> {
  if (!env.BACKGROUND_QUEUE_ENABLED) {
    await AuditLogModel.create(payload);
    return;
  }
  enqueue('auditLog', payload);
}

export async function enqueueLoginAudit(payload: Record<string, unknown>): Promise<void> {
  if (!env.BACKGROUND_QUEUE_ENABLED) {
    await LoginAuditModel.create(payload);
    return;
  }
  enqueue('loginAudit', payload);
}

export async function enqueueMobileTelemetry(payload: Record<string, unknown>): Promise<void> {
  if (!env.BACKGROUND_QUEUE_ENABLED) {
    await MobileTelemetryModel.create(payload);
    return;
  }
  enqueue('mobileTelemetry', payload);
}

export function getBackgroundQueueStats(): QueueStats {
  updatePending();
  return {
    ...stats,
    pending: { ...stats.pending },
    flushed: { ...stats.flushed },
    dropped: { ...stats.dropped },
    failures: { ...stats.failures },
  };
}
