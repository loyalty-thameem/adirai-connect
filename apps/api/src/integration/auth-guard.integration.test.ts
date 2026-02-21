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

type AuthDeps = {
  requireAuth: (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<void>;
  requireRoles: (roles: string[]) => (req: express.Request, res: express.Response, next: express.NextFunction) => void;
  createAccessToken: (payload: { sub: string; role: string; sessionId: string }) => string;
  UserModel: {
    findById: (id: string) => { lean: () => Promise<{ status: string } | null> };
  };
};

let authDepsPromise: Promise<AuthDeps> | undefined;

async function getAuthDeps(): Promise<AuthDeps> {
  ensureEnv();
  if (!authDepsPromise) {
    authDepsPromise = (async () => {
      const auth = await import('../common/middleware/auth.js');
      const service = await import('../modules/auth/auth.service.js');
      const users = await import('../modules/users/user.model.js');
      return {
        requireAuth: auth.requireAuth as AuthDeps['requireAuth'],
        requireRoles: auth.requireRoles as AuthDeps['requireRoles'],
        createAccessToken: service.createAccessToken as AuthDeps['createAccessToken'],
        UserModel: users.UserModel as unknown as AuthDeps['UserModel'],
      };
    })();
  }
  return authDepsPromise;
}

function createProtectedApp(deps: AuthDeps): express.Express {
  const app = express();
  app.get('/protected', deps.requireAuth, (_req, res) => {
    res.json({ ok: true });
  });
  app.get('/admin-only', deps.requireAuth, deps.requireRoles(['admin']), (_req, res) => {
    res.json({ ok: true, scope: 'admin' });
  });
  return app;
}

test('requireAuth rejects requests without bearer token', async () => {
  const deps = await getAuthDeps();
  const app = createProtectedApp(deps);
  const { baseUrl, close } = await startServer(app);

  const originalFindById = deps.UserModel.findById;
  deps.UserModel.findById = () => ({ lean: async () => ({ status: 'active' }) });
  try {
    const response = await fetch(`${baseUrl}/protected`);
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { message: 'Missing bearer token' });
  } finally {
    deps.UserModel.findById = originalFindById;
    await close();
  }
});

test('requireAuth accepts valid token when user is active', async () => {
  const deps = await getAuthDeps();
  const app = createProtectedApp(deps);
  const { baseUrl, close } = await startServer(app);

  const originalFindById = deps.UserModel.findById;
  deps.UserModel.findById = () => ({ lean: async () => ({ status: 'active' }) });
  try {
    const token = deps.createAccessToken({ sub: 'user_1', role: 'user', sessionId: 's1' });
    const response = await fetch(`${baseUrl}/protected`, {
      headers: { authorization: `Bearer ${token}` },
    });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true });
  } finally {
    deps.UserModel.findById = originalFindById;
    await close();
  }
});

test('requireRoles blocks non-admin token on admin-only route', async () => {
  const deps = await getAuthDeps();
  const app = createProtectedApp(deps);
  const { baseUrl, close } = await startServer(app);

  const originalFindById = deps.UserModel.findById;
  deps.UserModel.findById = () => ({ lean: async () => ({ status: 'active' }) });
  try {
    const token = deps.createAccessToken({ sub: 'user_2', role: 'user', sessionId: 's2' });
    const response = await fetch(`${baseUrl}/admin-only`, {
      headers: { authorization: `Bearer ${token}` },
    });
    assert.equal(response.status, 403);
    assert.deepEqual(await response.json(), { message: 'Forbidden' });
  } finally {
    deps.UserModel.findById = originalFindById;
    await close();
  }
});

test('requireRoles allows admin token on admin-only route', async () => {
  const deps = await getAuthDeps();
  const app = createProtectedApp(deps);
  const { baseUrl, close } = await startServer(app);

  const originalFindById = deps.UserModel.findById;
  deps.UserModel.findById = () => ({ lean: async () => ({ status: 'active' }) });
  try {
    const token = deps.createAccessToken({ sub: 'admin_1', role: 'admin', sessionId: 's3' });
    const response = await fetch(`${baseUrl}/admin-only`, {
      headers: { authorization: `Bearer ${token}` },
    });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true, scope: 'admin' });
  } finally {
    deps.UserModel.findById = originalFindById;
    await close();
  }
});
