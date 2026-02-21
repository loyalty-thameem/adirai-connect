import assert from 'node:assert/strict';
import test from 'node:test';
import type { Request, Response } from 'express';

function ensureEnv(): void {
  process.env.MONGO_URI = process.env.MONGO_URI ?? 'mongodb://localhost:27017/test';
  process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? 'test_access_secret_123456';
  process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'test_refresh_secret_123456';
}

function createReq(key: string, body: Record<string, unknown>): Request {
  const headers = new Map<string, string>([['x-idempotency-key', key]]);
  return {
    method: 'POST',
    originalUrl: '/api/v1/community/posts',
    body,
    ip: '127.0.0.1',
    header(name: string): string | undefined {
      return headers.get(name.toLowerCase());
    },
  } as unknown as Request;
}

function createRes() {
  const listeners: Array<() => void> = [];
  let statusCode = 200;
  let jsonBody: unknown;
  const res = {
    status(code: number): Response {
      statusCode = code;
      return res as unknown as Response;
    },
    json(body: unknown): Response {
      jsonBody = body;
      for (const fn of listeners) fn();
      return res as unknown as Response;
    },
    setHeader(): void {},
    on(event: 'finish', cb: () => void): void {
      if (event === 'finish') listeners.push(cb);
    },
    get statusCode(): number {
      return statusCode;
    },
    get body(): unknown {
      return jsonBody;
    },
  };
  return res;
}

test('background queue tracks dropped items when capacity is exceeded', async () => {
  ensureEnv();
  const { env } = await import('../config/env.js');
  const queue = await import('../common/background/write-queue.js');

  const prevMax = env.BACKGROUND_QUEUE_MAX_SIZE;
  const prevEnabled = env.BACKGROUND_QUEUE_ENABLED;
  env.BACKGROUND_QUEUE_ENABLED = true;
  env.BACKGROUND_QUEUE_MAX_SIZE = 2;

  const before = queue.getBackgroundQueueStats().dropped.auditLog;
  try {
    await queue.enqueueAuditLog({ a: 1 });
    await queue.enqueueAuditLog({ a: 2 });
    await queue.enqueueAuditLog({ a: 3 });
    const after = queue.getBackgroundQueueStats().dropped.auditLog;
    assert.equal(after > before, true);
  } finally {
    env.BACKGROUND_QUEUE_MAX_SIZE = prevMax;
    env.BACKGROUND_QUEUE_ENABLED = prevEnabled;
  }
});

test('background queue increments failure counter when batch insert fails', async () => {
  ensureEnv();
  const { env } = await import('../config/env.js');
  const queue = await import('../common/background/write-queue.js');
  const { AuditLogModel } = await import('../modules/admin/audit-log.model.js');

  const prevEnabled = env.BACKGROUND_QUEUE_ENABLED;
  const prevMax = env.BACKGROUND_QUEUE_MAX_SIZE;
  const originalInsertMany = AuditLogModel.insertMany;
  env.BACKGROUND_QUEUE_ENABLED = true;
  env.BACKGROUND_QUEUE_MAX_SIZE = 50_000;
  AuditLogModel.insertMany = (async () => {
    throw new Error('insert_failed');
  }) as typeof AuditLogModel.insertMany;

  const before = queue.getBackgroundQueueStats().failures.auditLog;
  try {
    await queue.enqueueAuditLog({ k: 'v' });
    await queue.flushBackgroundWriteQueue();
    const after = queue.getBackgroundQueueStats().failures.auditLog;
    assert.equal(after > before, true);
  } finally {
    AuditLogModel.insertMany = originalInsertMany;
    env.BACKGROUND_QUEUE_ENABLED = prevEnabled;
    env.BACKGROUND_QUEUE_MAX_SIZE = prevMax;
  }
});

test('idempotency cache evicts oldest entry when max entries is reached', async () => {
  ensureEnv();
  const { env } = await import('../config/env.js');
  const { idempotencyMiddleware, getIdempotencyStats } = await import(
    '../common/middleware/idempotency.js'
  );

  const prevEnabled = env.IDEMPOTENCY_ENABLED;
  const prevMax = env.IDEMPOTENCY_MAX_ENTRIES;
  env.IDEMPOTENCY_ENABLED = true;
  env.IDEMPOTENCY_MAX_ENTRIES = 2;

  const before = getIdempotencyStats().evicted;
  try {
    for (const n of [1, 2, 3]) {
      const req = createReq(`evict_key_${n}`, { n });
      const res = createRes();
      idempotencyMiddleware(req, res as unknown as Response, (() => {
        res.status(201).json({ ok: n });
      }) as any);
    }
    const after = getIdempotencyStats().evicted;
    assert.equal(after > before, true);
  } finally {
    env.IDEMPOTENCY_ENABLED = prevEnabled;
    env.IDEMPOTENCY_MAX_ENTRIES = prevMax;
  }
});

test('maintenance cleanup propagates errors from failing collection operation', async () => {
  ensureEnv();
  const maintenance = await import('../common/maintenance/cleanup.js');
  const { OtpCodeModel } = await import('../modules/auth/otp.model.js');

  const originalDeleteMany = OtpCodeModel.deleteMany;
  OtpCodeModel.deleteMany = ((async () => {
    throw new Error('cleanup_failed');
  }) as unknown) as typeof OtpCodeModel.deleteMany;

  try {
    await assert.rejects(async () => {
      await maintenance.runCleanupOnce();
    });
  } finally {
    OtpCodeModel.deleteMany = originalDeleteMany;
  }
});
