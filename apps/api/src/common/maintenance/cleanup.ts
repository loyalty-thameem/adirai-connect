import { AuditLogModel } from '../../modules/admin/audit-log.model.js';
import { SecurityEventModel } from '../../modules/admin/security-event.model.js';
import { LoginAuditModel } from '../../modules/auth/login-audit.model.js';
import { OtpCodeModel } from '../../modules/auth/otp.model.js';
import { PasswordResetModel } from '../../modules/auth/password-reset.model.js';
import { SessionModel } from '../../modules/auth/session.model.js';
import { MobileTelemetryModel } from '../../modules/community/mobile-telemetry.model.js';
import { PostSignalModel } from '../../modules/community/post-signal.model.js';
import { env } from '../../config/env.js';

type CleanupRunStats = {
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  deleted: {
    otpCodes: number;
    passwordResets: number;
    sessions: number;
    loginAudits: number;
    auditLogs: number;
    mobileTelemetry: number;
    postSignals: number;
    securityEvents: number;
  };
  error?: string;
};

type MaintenanceState = {
  enabled: boolean;
  intervalSec: number;
  inProgress: boolean;
  startedAt?: string;
  lastRun?: CleanupRunStats;
  runs: number;
  failures: number;
};

const state: MaintenanceState = {
  enabled: env.MAINTENANCE_ENABLED,
  intervalSec: env.MAINTENANCE_INTERVAL_SEC,
  inProgress: false,
  runs: 0,
  failures: 0,
};

let maintenanceTimer: ReturnType<typeof setInterval> | undefined;

function cutoffDate(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export async function runCleanupOnce(): Promise<CleanupRunStats> {
  const started = Date.now();
  const now = new Date();

  const authCutoff = cutoffDate(env.RETENTION_AUTH_DAYS);
  const loginAuditCutoff = cutoffDate(env.RETENTION_LOGIN_AUDIT_DAYS);
  const auditLogCutoff = cutoffDate(env.RETENTION_AUDIT_LOG_DAYS);
  const telemetryCutoff = cutoffDate(env.RETENTION_TELEMETRY_DAYS);
  const postSignalCutoff = cutoffDate(env.RETENTION_POST_SIGNAL_DAYS);
  const securityEventCutoff = cutoffDate(env.RETENTION_SECURITY_EVENT_DAYS);

  const [otpCodes, passwordResets, sessions, loginAudits, auditLogs, mobileTelemetry, postSignals, securityEvents] =
    await Promise.all([
      OtpCodeModel.deleteMany({
        $or: [{ expiresAt: { $lt: now } }, { usedAt: { $lt: authCutoff } }],
      }),
      PasswordResetModel.deleteMany({
        $or: [{ expiresAt: { $lt: now } }, { consumedAt: { $lt: authCutoff } }],
      }),
      SessionModel.deleteMany({
        $or: [{ expiresAt: { $lt: now } }, { revokedAt: { $lt: authCutoff } }],
      }),
      LoginAuditModel.deleteMany({ createdAt: { $lt: loginAuditCutoff } }),
      AuditLogModel.deleteMany({ createdAt: { $lt: auditLogCutoff } }),
      MobileTelemetryModel.deleteMany({ createdAt: { $lt: telemetryCutoff } }),
      PostSignalModel.deleteMany({ createdAt: { $lt: postSignalCutoff } }),
      SecurityEventModel.deleteMany({
        resolved: true,
        createdAt: { $lt: securityEventCutoff },
      }),
    ]);

  const finished = Date.now();
  return {
    startedAt: new Date(started).toISOString(),
    finishedAt: new Date(finished).toISOString(),
    durationMs: finished - started,
    deleted: {
      otpCodes: otpCodes.deletedCount,
      passwordResets: passwordResets.deletedCount,
      sessions: sessions.deletedCount,
      loginAudits: loginAudits.deletedCount,
      auditLogs: auditLogs.deletedCount,
      mobileTelemetry: mobileTelemetry.deletedCount,
      postSignals: postSignals.deletedCount,
      securityEvents: securityEvents.deletedCount,
    },
  };
}

async function runCleanupSafely(): Promise<void> {
  if (state.inProgress) {
    return;
  }

  state.inProgress = true;
  try {
    const result = await runCleanupOnce();
    state.lastRun = result;
    state.runs += 1;
    // eslint-disable-next-line no-console
    console.log(
      `[maintenance] cleanup complete durationMs=${result.durationMs} deleted=${JSON.stringify(result.deleted)}`,
    );
  } catch (error) {
    state.runs += 1;
    state.failures += 1;
    state.lastRun = {
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs: 0,
      deleted: {
        otpCodes: 0,
        passwordResets: 0,
        sessions: 0,
        loginAudits: 0,
        auditLogs: 0,
        mobileTelemetry: 0,
        postSignals: 0,
        securityEvents: 0,
      },
      error: error instanceof Error ? error.message : 'cleanup_failed',
    };
    // eslint-disable-next-line no-console
    console.error('[maintenance] cleanup failed', error);
  } finally {
    state.inProgress = false;
  }
}

export function startMaintenanceJobs(): void {
  if (!env.MAINTENANCE_ENABLED || maintenanceTimer) {
    return;
  }

  state.startedAt = new Date().toISOString();
  void runCleanupSafely();
  maintenanceTimer = setInterval(() => {
    void runCleanupSafely();
  }, env.MAINTENANCE_INTERVAL_SEC * 1000);
}

export function stopMaintenanceJobs(): void {
  if (!maintenanceTimer) {
    return;
  }
  clearInterval(maintenanceTimer);
  maintenanceTimer = undefined;
}

export function getMaintenanceStatus(): MaintenanceState {
  return { ...state };
}
