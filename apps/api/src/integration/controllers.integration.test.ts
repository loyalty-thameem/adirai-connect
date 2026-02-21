import assert from 'node:assert/strict';
import test from 'node:test';
import type { Request, Response } from 'express';

function ensureEnv(): void {
  process.env.MONGO_URI = process.env.MONGO_URI ?? 'mongodb://localhost:27017/test';
  process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? 'test_access_secret_123456';
  process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'test_refresh_secret_123456';
}

function createMockRes() {
  let statusCode = 200;
  let body: unknown;
  const res = {
    status(code: number): Response {
      statusCode = code;
      return res as unknown as Response;
    },
    json(payload: unknown): Response {
      body = payload;
      return res as unknown as Response;
    },
    get statusCode(): number {
      return statusCode;
    },
    get body(): unknown {
      return body;
    },
  };
  return res;
}

type Deps = {
  createPost: (req: Request, res: Response) => Promise<void>;
  listUsers: (req: Request, res: Response) => Promise<void>;
  UserModel: any;
  PostModel: any;
};

let depsPromise: Promise<Deps> | undefined;

async function getDeps(): Promise<Deps> {
  ensureEnv();
  if (!depsPromise) {
    depsPromise = (async () => {
      const community = await import('../modules/community/community.controller.js');
      const admin = await import('../modules/admin/admin.controller.js');
      const users = await import('../modules/users/user.model.js');
      const posts = await import('../modules/admin/post.model.js');
      return {
        createPost: community.createPost,
        listUsers: admin.listUsers,
        UserModel: users.UserModel as any,
        PostModel: posts.PostModel as any,
      };
    })();
  }
  return depsPromise;
}

test('community createPost returns 400 when user reference is invalid', async () => {
  const deps = await getDeps();
  const originalFindOne = deps.UserModel.findOne;
  const originalPostCreate = deps.PostModel.create;

  let createCalled = false;
  deps.UserModel.findOne = () => ({ lean: async () => null });
  deps.PostModel.create = async () => {
    createCalled = true;
    return {};
  };

  const req = {
    body: {
      userId: '99999999',
      content: 'hello world',
      category: 'thought',
      isAnonymous: false,
    },
  } as Request;
  const res = createMockRes();

  try {
    await deps.createPost(req, res as unknown as Response);
    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, { message: 'Invalid userId/mobile' });
    assert.equal(createCalled, false);
  } finally {
    deps.UserModel.findOne = originalFindOne;
    deps.PostModel.create = originalPostCreate;
  }
});

test('community createPost creates post when mobile resolves to user', async () => {
  const deps = await getDeps();
  const originalFindOne = deps.UserModel.findOne;
  const originalPostCreate = deps.PostModel.create;

  let capturedPayload: Record<string, unknown> | undefined;
  deps.UserModel.findOne = () => ({ lean: async () => ({ _id: '507f1f77bcf86cd799439011' }) });
  deps.PostModel.create = async (payload: Record<string, unknown>) => {
    capturedPayload = payload;
    return { _id: 'post_1', ...payload };
  };

  const req = {
    body: {
      userId: '9876543210',
      content: 'public update',
      category: 'announcement',
      locationTag: 'Adirai',
      isAnonymous: false,
    },
  } as Request;
  const res = createMockRes();

  try {
    await deps.createPost(req, res as unknown as Response);
    assert.equal(res.statusCode, 201);
    assert.equal(capturedPayload?.userId, '507f1f77bcf86cd799439011');
    assert.deepEqual(res.body, {
      _id: 'post_1',
      userId: '507f1f77bcf86cd799439011',
      content: 'public update',
      category: 'announcement',
      locationTag: 'Adirai',
      isAnonymous: false,
    });
  } finally {
    deps.UserModel.findOne = originalFindOne;
    deps.PostModel.create = originalPostCreate;
  }
});

test('admin listUsers returns paginated data', async () => {
  const deps = await getDeps();
  const originalFind = deps.UserModel.find;
  const originalCountDocuments = deps.UserModel.countDocuments;

  const items = [
    { _id: 'u1', name: 'A', role: 'user', status: 'active', area: 'Adirai' },
    { _id: 'u2', name: 'B', role: 'moderator', status: 'active', area: 'Adirai' },
  ];

  const chain = {
    sort: () => chain,
    skip: () => chain,
    limit: () => chain,
    lean: async () => items,
  };

  deps.UserModel.find = () => chain;
  deps.UserModel.countDocuments = async () => 2;

  const req = {
    query: {
      area: 'Adirai',
      page: '1',
      pageSize: '2',
    },
  } as unknown as Request;
  const res = createMockRes();

  try {
    await deps.listUsers(req as any, res as unknown as Response);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, {
      items,
      pagination: {
        page: 1,
        pageSize: 2,
        total: 2,
      },
    });
  } finally {
    deps.UserModel.find = originalFind;
    deps.UserModel.countDocuments = originalCountDocuments;
  }
});
