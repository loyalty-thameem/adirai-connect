import { Router } from 'express';
import mongoose from 'mongoose';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  res.json({
    service: 'adirai-api',
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

healthRouter.get('/live', (_req, res) => {
  res.json({
    service: 'adirai-api',
    status: 'live',
    uptimeSec: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

healthRouter.get('/ready', (_req, res) => {
  const isDbReady = mongoose.connection.readyState === 1;
  if (!isDbReady) {
    res.status(503).json({
      service: 'adirai-api',
      status: 'not_ready',
      dbReady: false,
      timestamp: new Date().toISOString(),
    });
    return;
  }
  res.json({
    service: 'adirai-api',
    status: 'ready',
    dbReady: true,
    timestamp: new Date().toISOString(),
  });
});

healthRouter.get('/metrics', (_req, res) => {
  const mem = process.memoryUsage();
  res.json({
    service: 'adirai-api',
    uptimeSec: Math.round(process.uptime()),
    dbReady: mongoose.connection.readyState === 1,
    memory: {
      rss: mem.rss,
      heapTotal: mem.heapTotal,
      heapUsed: mem.heapUsed,
      external: mem.external,
    },
    timestamp: new Date().toISOString(),
  });
});
