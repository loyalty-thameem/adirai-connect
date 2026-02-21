import mongoose from 'mongoose';
import { env } from './env.js';

let queryProfilingAttached = false;

function toDurationMs(rawDuration: unknown): number {
  if (typeof rawDuration !== 'number' || Number.isNaN(rawDuration)) {
    return 0;
  }
  return rawDuration > 10_000 ? rawDuration / 1000 : rawDuration;
}

function attachQueryProfiling(): void {
  if (queryProfilingAttached || !env.DB_QUERY_PROFILING_ENABLED) {
    return;
  }

  const client = mongoose.connection.getClient();
  client.on('commandSucceeded', (event: any) => {
    const commandName = String(event?.commandName ?? '');
    const durationMs = toDurationMs(event?.duration);
    if (durationMs < env.DB_SLOW_QUERY_MS) {
      return;
    }
    // eslint-disable-next-line no-console
    console.warn(
      `[db][slow] command=${commandName} durationMs=${durationMs.toFixed(1)} db=${String(event?.databaseName ?? '')}`,
    );
  });

  queryProfilingAttached = true;
}

export async function connectDb(): Promise<void> {
  await mongoose.connect(env.MONGO_URI, {
    monitorCommands: env.DB_QUERY_PROFILING_ENABLED,
  });
  attachQueryProfiling();
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}
