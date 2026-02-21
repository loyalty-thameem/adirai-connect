import { app } from './app.js';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';

async function bootstrap(): Promise<void> {
  await connectDb();
  app.listen(env.API_PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on http://localhost:${env.API_PORT}`);
  });
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start API', error);
  process.exit(1);
});

