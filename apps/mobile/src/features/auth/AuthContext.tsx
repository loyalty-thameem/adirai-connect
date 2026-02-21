import React from 'react';
import { mobileApi } from '../../shared/api';
import { clearSession, loadSession, saveSession } from '../../shared/session-storage';
import type { MobileSession } from '../../shared/types';

type AuthContextType = {
  session: MobileSession | null;
  ready: boolean;
  loginWithPassword: (params: { mobile: string; password: string; area: string }) => Promise<void>;
  loginWithOtp: (params: { mobile: string; otp: string; area: string }) => Promise<void>;
  requestOtp: (mobile: string) => Promise<string>;
  logoutCurrent: () => Promise<void>;
  logoutAllDevices: () => Promise<void>;
  refreshNow: () => Promise<void>;
};

const AuthContext = React.createContext<AuthContextType | null>(null);

function newSessionId() {
  return `mob-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<MobileSession | null>(null);
  const [ready, setReady] = React.useState(false);

  const setAndPersist = React.useCallback(async (next: MobileSession | null) => {
    setSession(next);
    if (next) {
      await saveSession(next);
    } else {
      await clearSession();
    }
  }, []);

  const refreshNow = React.useCallback(async () => {
    if (!session) return;
    const refreshed = await mobileApi.refreshSession(session.refreshToken);
    const next: MobileSession = {
      ...session,
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken,
      updatedAtMs: Date.now(),
    };
    await setAndPersist(next);
  }, [session, setAndPersist]);

  React.useEffect(() => {
    const bootstrap = async () => {
      const stored = await loadSession();
      if (!stored) {
        setReady(true);
        return;
      }
      try {
        const refreshed = await mobileApi.refreshSession(stored.refreshToken);
        const next: MobileSession = {
          ...stored,
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken,
          updatedAtMs: Date.now(),
        };
        await setAndPersist(next);
      } catch {
        await setAndPersist(null);
      } finally {
        setReady(true);
      }
    };
    void bootstrap();
  }, [setAndPersist]);

  React.useEffect(() => {
    if (!session) return;
    const id = setInterval(() => {
      void refreshNow().catch(() => {
        void setAndPersist(null);
      });
    }, 10 * 60 * 1000);
    return () => clearInterval(id);
  }, [refreshNow, session, setAndPersist]);

  const loginWithPassword = React.useCallback(
    async (params: { mobile: string; password: string; area: string }) => {
      const response = await mobileApi.passwordLogin(params.mobile, params.password);
      await setAndPersist({
        mobile: params.mobile,
        area: params.area,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        sessionId: newSessionId(),
        startedAtMs: Date.now(),
        updatedAtMs: Date.now(),
      });
    },
    [setAndPersist],
  );

  const loginWithOtp = React.useCallback(
    async (params: { mobile: string; otp: string; area: string }) => {
      const response = await mobileApi.verifyOtpLogin(params.mobile, params.otp);
      await setAndPersist({
        mobile: params.mobile,
        area: params.area,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        sessionId: newSessionId(),
        startedAtMs: Date.now(),
        updatedAtMs: Date.now(),
      });
    },
    [setAndPersist],
  );

  const requestOtp = React.useCallback(async (mobile: string) => {
    const response = await mobileApi.requestOtp(mobile);
    return response.otpDevOnly;
  }, []);

  const logoutCurrent = React.useCallback(async () => {
    if (session) {
      try {
        await mobileApi.logout(session.accessToken, session.refreshToken);
      } catch {
        // Continue local logout even if server call fails.
      }
    }
    await setAndPersist(null);
  }, [session, setAndPersist]);

  const logoutAllDevices = React.useCallback(async () => {
    if (session) {
      try {
        await mobileApi.logoutAll(session.accessToken);
      } catch {
        // Continue local logout even if server call fails.
      }
    }
    await setAndPersist(null);
  }, [session, setAndPersist]);

  const value = React.useMemo<AuthContextType>(
    () => ({
      session,
      ready,
      loginWithPassword,
      loginWithOtp,
      requestOtp,
      logoutCurrent,
      logoutAllDevices,
      refreshNow,
    }),
    [loginWithOtp, loginWithPassword, logoutAllDevices, logoutCurrent, ready, refreshNow, requestOtp, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}

