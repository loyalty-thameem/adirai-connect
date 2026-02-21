import { Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  res.json({
    service: 'adirai-api',
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

