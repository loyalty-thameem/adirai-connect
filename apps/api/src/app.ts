import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { errorHandler } from './common/middleware/errorHandler.js';
import { notFound } from './common/middleware/notFound.js';
import { createRateLimit } from './common/middleware/rateLimit.js';
import { requestAudit } from './common/middleware/requestAudit.js';
import { openApiSpec } from './docs/openapi.js';
import { adminRouter } from './modules/admin/admin.routes.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { communityRouter } from './modules/community/community.routes.js';
import { healthRouter } from './modules/health/health.routes.js';

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: [env.CORS_ORIGIN_WEB, env.CORS_ORIGIN_ADMIN],
    credentials: true,
  }),
);
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(requestAudit);

app.use('/api/v1/health', healthRouter);
app.use(
  '/api/v1/auth',
  createRateLimit({ windowMs: 60 * 1000, limit: 80, keyPrefix: 'auth' }),
  authRouter,
);
app.use(
  '/api/v1/admin',
  createRateLimit({ windowMs: 60 * 1000, limit: 200, keyPrefix: 'admin' }),
  adminRouter,
);
app.use(
  '/api/v1/community',
  createRateLimit({ windowMs: 60 * 1000, limit: 240, keyPrefix: 'community' }),
  communityRouter,
);

if (env.SWAGGER_ENABLED) {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
}

app.use(notFound);
app.use(errorHandler);
