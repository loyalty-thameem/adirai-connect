import assert from 'node:assert/strict';
import test from 'node:test';
import type { NextFunction, Request, Response } from 'express';

type ListenerMap = {
  finish: Array<() => void>;
};

type MockReqOptions = {
  method?: string;
  originalUrl?: string;
  body?: unknown;
  ip?: string;
  headers?: Record<string, string>;
};

let middlewarePromise: Promise<typeof import('./idempotency.js')> | undefined;

function ensureEnv(): void {
  process.env.MONGO_URI = process.env.MONGO_URI ?? 'mongodb://localhost:27017/test';
  process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? 'test_access_secret_123456';
  process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'test_refresh_secret_123456';
}

async function getMiddleware() {
  ensureEnv();
  middlewarePromise ??= import('./idempotency.js');
  return middlewarePromise;
}

function createMockReq(overrides?: MockReqOptions): Request {
  const headers = new Map<string, string>();
  const req = {
    method: overrides?.method ?? 'POST',
    originalUrl: overrides?.originalUrl ?? '/api/v1/community/posts',
    body: overrides?.body ?? { a: 1 },
    ip: overrides?.ip ?? '127.0.0.1',
    header(name: string): string | undefined {
      return headers.get(name.toLowerCase());
    },
  } as unknown as Request;

  for (const [k, v] of Object.entries(overrides?.headers ?? {})) {
    headers.set(k.toLowerCase(), v);
  }

  return req;
}

function createMockRes() {
  const listeners: ListenerMap = { finish: [] };
  const headers = new Map<string, string>();
  let statusCode = 200;
  let jsonBody: unknown;

  const res = {
    status(code: number): Response {
      statusCode = code;
      return res as unknown as Response;
    },
    json(body: unknown): Response {
      jsonBody = body;
      for (const fn of listeners.finish) fn();
      return res as unknown as Response;
    },
    setHeader(name: string, value: string): void {
      headers.set(name.toLowerCase(), value);
    },
    on(event: 'finish', cb: () => void): void {
      listeners[event].push(cb);
    },
    get statusCode(): number {
      return statusCode;
    },
    get body(): unknown {
      return jsonBody;
    },
    getHeader(name: string): string | undefined {
      return headers.get(name.toLowerCase());
    },
  };

  return res;
}

test('idempotency replays cached response for same request key', async () => {
  const { idempotencyMiddleware } = await getMiddleware();
  const req1 = createMockReq({
    headers: { 'x-idempotency-key': 'idem_key_123456' },
  });
  const res1 = createMockRes();
  let nextCalled = false;

  idempotencyMiddleware(req1, res1 as unknown as Response, (() => {
    nextCalled = true;
    res1.status(201).json({ ok: true, id: 'first' });
  }) as NextFunction);

  assert.equal(nextCalled, true);
  assert.equal(res1.statusCode, 201);

  const req2 = createMockReq({
    headers: { 'x-idempotency-key': 'idem_key_123456' },
  });
  const res2 = createMockRes();
  idempotencyMiddleware(req2, res2 as unknown as Response, (() => {
    throw new Error('should not execute handler on replay');
  }) as NextFunction);

  assert.equal(res2.statusCode, 201);
  assert.deepEqual(res2.body, { ok: true, id: 'first' });
  assert.equal(res2.getHeader('x-idempotency-replay'), 'true');
});

test('idempotency returns 409 when same request key is still in progress', async () => {
  const { idempotencyMiddleware } = await getMiddleware();
  const req1 = createMockReq({
    headers: { 'x-idempotency-key': 'idem_key_abcdef' },
  });
  const res1 = createMockRes();

  idempotencyMiddleware(req1, res1 as unknown as Response, (() => {
    // Keep request in progress by not finishing response.
  }) as NextFunction);

  const req2 = createMockReq({
    headers: { 'x-idempotency-key': 'idem_key_abcdef' },
  });
  const res2 = createMockRes();

  idempotencyMiddleware(req2, res2 as unknown as Response, (() => {
    throw new Error('should not call handler while in progress');
  }) as NextFunction);

  assert.equal(res2.statusCode, 409);
  assert.deepEqual(res2.body, {
    message: 'Request with this idempotency key is still in progress',
  });
});

test('idempotency rejects malformed key with 400', async () => {
  const { idempotencyMiddleware } = await getMiddleware();
  const req = createMockReq({
    headers: { 'x-idempotency-key': 'bad key with spaces' },
  });
  const res = createMockRes();

  idempotencyMiddleware(req, res as unknown as Response, (() => {
    throw new Error('should not call handler with invalid key');
  }) as NextFunction);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { message: 'Invalid x-idempotency-key format' });
});
