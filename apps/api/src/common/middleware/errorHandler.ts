import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/apiError.js';
import { markUnhandledError } from '../observability/metrics.js';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      message: err.message,
      requestId: req.requestId ?? 'unknown',
    });
    return;
  }

  markUnhandledError();
  res.status(500).json({
    message: 'Internal server error',
    requestId: req.requestId ?? 'unknown',
  });
}
