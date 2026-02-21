import { Router } from 'express';
import mongoose from 'mongoose';
import {
  getPrometheusMetrics,
  getRuntimeMetricsSnapshot,
} from '../../common/observability/metrics.js';
import { getBackgroundQueueStats } from '../../common/background/write-queue.js';
import { getMaintenanceStatus } from '../../common/maintenance/cleanup.js';
import { getIdempotencyStats } from '../../common/middleware/idempotency.js';

export const healthRouter = Router();
const serviceName = 'adirai-api';

healthRouter.get('/', (_req, res) => {
  res.json({
    service: serviceName,
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

healthRouter.get('/live', (_req, res) => {
  res.json({
    service: serviceName,
    status: 'live',
    uptimeSec: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

healthRouter.get('/ready', (_req, res) => {
  const isDbReady = mongoose.connection.readyState === 1;
  if (!isDbReady) {
    res.status(503).json({
      service: serviceName,
      status: 'not_ready',
      dbReady: false,
      timestamp: new Date().toISOString(),
    });
    return;
  }
  res.json({
    service: serviceName,
    status: 'ready',
    dbReady: true,
    timestamp: new Date().toISOString(),
  });
});

healthRouter.get('/metrics', (_req, res) => {
  const mem = process.memoryUsage();
  const runtime = getRuntimeMetricsSnapshot();
  const idempotency = getIdempotencyStats();
  const queue = getBackgroundQueueStats();
  const maintenance = getMaintenanceStatus();
  res.json({
    service: serviceName,
    uptimeSec: Math.round(process.uptime()),
    dbReady: mongoose.connection.readyState === 1,
    runtime,
    idempotency,
    queue,
    maintenance,
    memory: {
      rss: mem.rss,
      heapTotal: mem.heapTotal,
      heapUsed: mem.heapUsed,
      external: mem.external,
    },
    timestamp: new Date().toISOString(),
  });
});

healthRouter.get('/metrics/prometheus', (_req, res) => {
  res.type('text/plain; version=0.0.4; charset=utf-8');
  res.send(getPrometheusMetrics(serviceName));
});
