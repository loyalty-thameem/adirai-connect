import type { NextFunction, Request, Response } from 'express';

type RateLimitOptions = {
  windowMs: number;
  limit: number;
  keyPrefix: string;
};

const store = new Map<string, { count: number; resetAt: number }>();

function getClientKey(req: Request, keyPrefix: string): string {
  const deviceId = req.header('x-device-id') ?? 'no-device';
  const ip = req.ip ?? 'no-ip';
  return `${keyPrefix}:${ip}:${deviceId}`;
}

export function createRateLimit(options: RateLimitOptions) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now();
    const key = getClientKey(req, options.keyPrefix);
    const current = store.get(key);

    if (!current || current.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + options.windowMs });
      next();
      return;
    }

    if (current.count >= options.limit) {
      const retryAfterSec = Math.ceil((current.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(Math.max(1, retryAfterSec)));
      res.status(429).json({ message: 'Rate limit exceeded', retryAfterSec });
      return;
    }

    current.count += 1;
    store.set(key, current);
    next();
  };
}

