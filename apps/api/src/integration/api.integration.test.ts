import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import type { AddressInfo } from 'node:net';

function ensureEnv(): void {
  process.env.MONGO_URI = process.env.MONGO_URI ?? 'mongodb://localhost:27017/test';
  process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? 'test_access_secret_123456';
  process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'test_refresh_secret_123456';
}

async function startServer(app: express.Express): Promise<{
  baseUrl: string;
  close: () => Promise<void>;
}> {
  return await new Promise((resolve) => {
    const server = app.listen(0, () => {
      const address = server.address() as AddressInfo;
      resolve({
        baseUrl: `http://127.0.0.1:${address.port}`,
        close: () =>
          new Promise((done) => {
            server.close(() => done());
          }),
      });
    });
  });
}

let appPromise: Promise<typeof import('../app.js')> | undefined;
let idempotencyPromise: Promise<typeof import('../common/middleware/idempotency.js')> | undefined;

async function getApiApp() {
  ensureEnv();
  appPromise ??= import('../app.js');
  return appPromise;
}

async function getIdempotencyMiddleware() {
  ensureEnv();
  idempotencyPromise ??= import('../common/middleware/idempotency.js');
  return idempotencyPromise;
}

test('health metrics endpoint returns runtime platform sections', async () => {
  const { app } = await getApiApp();
  const { baseUrl, close } = await startServer(app);

  try {
    const response = await fetch(`${baseUrl}/api/v1/health/metrics`);
    assert.equal(response.status, 200);
    const payload = (await response.json()) as Record<string, unknown>;
    assert.equal(typeof payload.runtime, 'object');
    assert.equal(typeof payload.idempotency, 'object');
    assert.equal(typeof payload.queue, 'object');
    assert.equal(typeof payload.maintenance, 'object');
  } finally {
    await close();
  }
});

test('health prometheus endpoint returns text metrics', async () => {
  const { app } = await getApiApp();
  const { baseUrl, close } = await startServer(app);

  try {
    const response = await fetch(`${baseUrl}/api/v1/health/metrics/prometheus`);
    assert.equal(response.status, 200);
    const text = await response.text();
    assert.equal(text.includes('adirai_http_requests_total'), true);
    assert.equal(text.includes('adirai_uptime_seconds'), true);
  } finally {
    await close();
  }
});

test('idempotency middleware replays response in integration flow', async () => {
  const { idempotencyMiddleware } = await getIdempotencyMiddleware();
  const app = express();
  app.use(express.json());
  app.use(idempotencyMiddleware);

  let writes = 0;
  app.post('/echo', (_req, res) => {
    writes += 1;
    res.status(201).json({ writes });
  });

  const { baseUrl, close } = await startServer(app);
  try {
    const first = await fetch(`${baseUrl}/echo`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-idempotency-key': 'step18_integration_001',
      },
      body: JSON.stringify({ action: 'create' }),
    });
    assert.equal(first.status, 201);
    assert.deepEqual(await first.json(), { writes: 1 });

    const second = await fetch(`${baseUrl}/echo`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-idempotency-key': 'step18_integration_001',
      },
      body: JSON.stringify({ action: 'create' }),
    });
    assert.equal(second.status, 201);
    assert.equal(second.headers.get('x-idempotency-replay'), 'true');
    assert.deepEqual(await second.json(), { writes: 1 });
    assert.equal(writes, 1);
  } finally {
    await close();
  }
});
