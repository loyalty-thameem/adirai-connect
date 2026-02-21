import type { NextFunction, Request, Response } from 'express';
import { markRequestEnd, markRequestStart } from '../observability/metrics.js';

export function requestMetrics(_req: Request, res: Response, next: NextFunction): void {
  const startedAtNs = markRequestStart();

  res.on('finish', () => {
    markRequestEnd(res.statusCode, startedAtNs);
  });

  next();
}
