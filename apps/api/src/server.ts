import { app } from './app.js';
import { startBackgroundWriteQueue, stopBackgroundWriteQueue } from './common/background/write-queue.js';
import { startMaintenanceJobs, stopMaintenanceJobs } from './common/maintenance/cleanup.js';
import { connectDb, disconnectDb } from './config/db.js';
import { env } from './config/env.js';

async function bootstrap(): Promise<void> {
  await connectDb();
  const server = app.listen(env.API_PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on http://localhost:${env.API_PORT}`);
  });
  startBackgroundWriteQueue();
  startMaintenanceJobs();

  let shuttingDown = false;

  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;
    // eslint-disable-next-line no-console
    console.log(`Received ${signal}. Starting graceful shutdown...`);
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
    await stopBackgroundWriteQueue();
    stopMaintenanceJobs();
    await disconnectDb();
    // eslint-disable-next-line no-console
    console.log('Graceful shutdown completed.');
    process.exit(0);
  };

  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });
  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start API', error);
  process.exit(1);
});
