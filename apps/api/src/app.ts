import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { errorHandler } from './common/middleware/errorHandler.js';
import { notFound } from './common/middleware/notFound.js';
import { openApiSpec } from './docs/openapi.js';
import { adminRouter } from './modules/admin/admin.routes.js';
import { authRouter } from './modules/auth/auth.routes.js';
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

app.use('/api/v1/health', healthRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/admin', adminRouter);

if (env.SWAGGER_ENABLED) {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
}

app.use(notFound);
app.use(errorHandler);
