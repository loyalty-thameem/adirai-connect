import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import { env } from '../../config/env.js';

type CacheState = 'in_progress' | 'done';

type CacheEntry = {
  state: CacheState;
  expiresAt: number;
  createdAt: number;
  statusCode?: number;
  body?: unknown;
};

type IdempotencyStats = {
  enabled: boolean;
  ttlSec: number;
  maxEntries: number;
  entries: number;
  hits: number;
  misses: number;
  replays: number;
  conflicts: number;
  expired: number;
  evicted: number;
};

const idempotencyCache = new Map<string, CacheEntry>();

const stats: IdempotencyStats = {
  enabled: env.IDEMPOTENCY_ENABLED,
  ttlSec: env.IDEMPOTENCY_TTL_SEC,
  maxEntries: env.IDEMPOTENCY_MAX_ENTRIES,
  entries: 0,
  hits: 0,
  misses: 0,
  replays: 0,
  conflicts: 0,
  expired: 0,
  evicted: 0,
};

function hashValue(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
    a.localeCompare(b),
  );
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(',')}}`;
}

function buildScope(req: Request): string {
  const authHeader = req.header('authorization') ?? '';
  const deviceId = req.header('x-device-id') ?? '';
  return hashValue(`${authHeader}|${deviceId}|${req.ip}`);
}

function buildCacheKey(req: Request, key: string): string {
  const bodyHash = hashValue(stableStringify(req.body ?? {}));
  const scope = buildScope(req);
  return `${req.method}|${req.originalUrl}|${scope}|${key}|${bodyHash}`;
}

function cleanupExpired(now: number): void {
  for (const [key, entry] of idempotencyCache.entries()) {
    if (entry.expiresAt <= now) {
      idempotencyCache.delete(key);
      stats.expired += 1;
    }
  }
  stats.entries = idempotencyCache.size;
}

function evictIfNeeded(): void {
  while (idempotencyCache.size >= env.IDEMPOTENCY_MAX_ENTRIES) {
    const oldestKey = idempotencyCache.keys().next().value as string | undefined;
    if (!oldestKey) break;
    idempotencyCache.delete(oldestKey);
    stats.evicted += 1;
  }
  stats.entries = idempotencyCache.size;
}

function isMutationMethod(method: string): boolean {
  return method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE';
}

export function idempotencyMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!env.IDEMPOTENCY_ENABLED || !isMutationMethod(req.method.toUpperCase())) {
    next();
    return;
  }

  const key = req.header('x-idempotency-key');
  if (!key || key.trim().length === 0) {
    next();
    return;
  }
  if (!/^[a-zA-Z0-9:_-]{8,120}$/.test(key.trim())) {
    res.status(400).json({ message: 'Invalid x-idempotency-key format' });
    return;
  }

  const now = Date.now();
  cleanupExpired(now);

  const cacheKey = buildCacheKey(req, key.trim());
  const existing = idempotencyCache.get(cacheKey);
  if (existing) {
    stats.hits += 1;
    if (existing.state === 'in_progress') {
      stats.conflicts += 1;
      res.status(409).json({ message: 'Request with this idempotency key is still in progress' });
      return;
    }
    stats.replays += 1;
    res.setHeader('x-idempotency-replay', 'true');
    res.status(existing.statusCode ?? 200).json(existing.body ?? {});
    return;
  }

  stats.misses += 1;
  evictIfNeeded();
  idempotencyCache.set(cacheKey, {
    state: 'in_progress',
    createdAt: now,
    expiresAt: now + env.IDEMPOTENCY_TTL_SEC * 1000,
  });
  stats.entries = idempotencyCache.size;

  const originalJson = res.json.bind(res);
  let responseCaptured = false;
  let capturedBody: unknown;

  res.json = (body: unknown) => {
    responseCaptured = true;
    capturedBody = body;
    return originalJson(body);
  };

  res.on('finish', () => {
    const entry = idempotencyCache.get(cacheKey);
    if (!entry) return;
    if (res.statusCode >= 500 || !responseCaptured) {
      idempotencyCache.delete(cacheKey);
      stats.entries = idempotencyCache.size;
      return;
    }
    idempotencyCache.set(cacheKey, {
      ...entry,
      state: 'done',
      statusCode: res.statusCode,
      body: capturedBody,
    });
  });

  next();
}

export function getIdempotencyStats(): IdempotencyStats {
  cleanupExpired(Date.now());
  return { ...stats };
}
