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
});

export const env = envSchema.parse(process.env);

