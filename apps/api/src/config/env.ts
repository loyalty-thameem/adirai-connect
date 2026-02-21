import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ path: '../../.env' });
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().default(4000),
  MONGO_URI: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL: z.string().default('30d'),
  CORS_ORIGIN_WEB: z.string().default('http://localhost:5173'),
  CORS_ORIGIN_ADMIN: z.string().default('http://localhost:5174'),
  SWAGGER_ENABLED: z.coerce.boolean().default(true),
  DB_QUERY_PROFILING_ENABLED: z.coerce.boolean().default(false),
  DB_SLOW_QUERY_MS: z.coerce.number().int().positive().default(120),
  MAINTENANCE_ENABLED: z.coerce.boolean().default(true),
  MAINTENANCE_INTERVAL_SEC: z.coerce.number().int().positive().default(900),
  RETENTION_AUTH_DAYS: z.coerce.number().int().positive().default(14),
  RETENTION_LOGIN_AUDIT_DAYS: z.coerce.number().int().positive().default(30),
  RETENTION_AUDIT_LOG_DAYS: z.coerce.number().int().positive().default(30),
  RETENTION_TELEMETRY_DAYS: z.coerce.number().int().positive().default(30),
  RETENTION_POST_SIGNAL_DAYS: z.coerce.number().int().positive().default(30),
  RETENTION_SECURITY_EVENT_DAYS: z.coerce.number().int().positive().default(60),
  BACKGROUND_QUEUE_ENABLED: z.coerce.boolean().default(true),
  BACKGROUND_QUEUE_FLUSH_INTERVAL_MS: z.coerce.number().int().positive().default(1000),
  BACKGROUND_QUEUE_BATCH_SIZE: z.coerce.number().int().positive().default(100),
  BACKGROUND_QUEUE_MAX_SIZE: z.coerce.number().int().positive().default(5000),
  IDEMPOTENCY_ENABLED: z.coerce.boolean().default(true),
  IDEMPOTENCY_TTL_SEC: z.coerce.number().int().positive().default(600),
  IDEMPOTENCY_MAX_ENTRIES: z.coerce.number().int().positive().default(10000),
});

export const env = envSchema.parse(process.env);
