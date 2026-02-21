import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import { AuditLogModel } from '../../modules/admin/audit-log.model.js';
import { verifyAccessToken } from '../../modules/auth/auth.service.js';

export function requestAudit(req: Request, res: Response, next: NextFunction): void {
  const method = req.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    next();
    return;
  }

  const start = Date.now();
  const requestId = req.header('x-request-id') ?? crypto.randomUUID();
  res.setHeader('x-request-id', requestId);

  res.on('finish', () => {
    const authHeader = req.header('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    const payload = token ? verifyAccessToken(token) : null;

    void AuditLogModel.create({
      actorUserId: payload?.sub ?? '',
      method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      ipAddress: req.ip,
      userAgent: req.header('user-agent') ?? '',
      requestId,
      durationMs: Date.now() - start,
      metadata: {
        bodyKeys: Object.keys((req.body ?? {}) as Record<string, unknown>).slice(0, 20),
      },
    }).catch(() => {
      // Non-blocking logging.
    });
  });

  next();
}

