import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, Text, View, Pressable } from 'react-native';
import { AuthScreen } from './src/features/auth/AuthScreen';
import { ComplaintsScreen } from './src/features/complaints/ComplaintsScreen';
import { FeedScreen } from './src/features/feed/FeedScreen';
import { SettingsScreen } from './src/features/settings/SettingsScreen';
import { mobileApi } from './src/shared/api';
import type { MobileSession } from './src/shared/types';

type TabKey = 'feed' | 'complaints' | 'settings';

export default function App() {
  const [session, setSession] = React.useState<MobileSession | null>(null);
  const [tab, setTab] = React.useState<TabKey>('feed');

  const track = React.useCallback(
    async (eventType: 'screen_view' | 'action', extras: Record<string, unknown>) => {
      if (!session) return;
      await mobileApi.sendTelemetry({
        userId: session.mobile,
        sessionId: session.sessionId,
        platform: 'android',
        appVersion: '1.0.0',
        eventType,
        ...extras,
      });
    },
    [session],
  );

  const onAuthenticated = React.useCallback(async (next: MobileSession) => {
    setSession(next);
    await mobileApi.sendTelemetry({
      userId: next.mobile,
      sessionId: next.sessionId,
      platform: 'android',
      appVersion: '1.0.0',
      eventType: 'session_start',
      screen: 'auth',
      feature: 'login',
    });
  }, []);

  const onLogout = React.useCallback(async () => {
    if (session) {
      const durationSec = Math.max(1, Math.floor((Date.now() - session.startedAtMs) / 1000));
      await mobileApi.sendTelemetry({
        userId: session.mobile,
        sessionId: session.sessionId,
        platform: 'android',
        appVersion: '1.0.0',
        eventType: 'session_end',
        screen: 'settings',
        feature: 'logout',
        durationSec,
      });
    }
    setSession(null);
    setTab('feed');
  }, [session]);

  const content = React.useMemo(() => {
    if (!session) {
      return <AuthScreen onAuthenticated={onAuthenticated} />;
    }
    if (tab === 'complaints') {
      return (
        <ComplaintsScreen
          mobile={session.mobile}
          area={session.area}
          onScreenViewed={(screen) => void track('screen_view', { screen })}
          onActionTracked={(feature, metadata) => void track('action', { feature, metadata })}
        />
      );
    }
    if (tab === 'settings') {
      return <SettingsScreen onScreenViewed={(screen) => void track('screen_view', { screen })} onLogout={() => void onLogout()} />;
    }
    return (
      <FeedScreen
        mobile={session.mobile}
        area={session.area}
        onScreenViewed={(screen) => void track('screen_view', { screen })}
        onActionTracked={(feature, metadata) => void track('action', { feature, metadata })}
      />
    );
  }, [onAuthenticated, onLogout, session, tab, track]);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Adirai Connect Mobile</Text>
          <Text style={styles.title}>Auth + Feed + Complaints</Text>
          <Text style={styles.subtitle}>{session ? `Logged: ${session.mobile}` : 'Please login'}</Text>
        </View>
        {session ? (
          <View style={styles.tabs}>
            <Pressable style={tab === 'feed' ? styles.tabActive : styles.tab} onPress={() => setTab('feed')}>
              <Text style={styles.tabText}>Feed</Text>
            </Pressable>
            <Pressable style={tab === 'complaints' ? styles.tabActive : styles.tab} onPress={() => setTab('complaints')}>
              <Text style={styles.tabText}>Complaints</Text>
            </Pressable>
            <Pressable style={tab === 'settings' ? styles.tabActive : styles.tab} onPress={() => setTab('settings')}>
              <Text style={styles.tabText}>Settings</Text>
            </Pressable>
          </View>
        ) : null}
        <View style={styles.main}>{content}</View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#ecfeff' },
  content: { padding: 16, gap: 12, flex: 1 },
  header: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  eyebrow: { color: '#0f766e', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  title: { color: '#0f172a', fontSize: 20, fontWeight: '700', marginTop: 4 },
  subtitle: { color: '#64748b', marginTop: 2 },
  tabs: { flexDirection: 'row', gap: 8 },
  tab: { backgroundColor: '#475569', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12 },
  tabActive: { backgroundColor: '#0e7490', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12 },
  tabText: { color: '#fff', fontWeight: '700' },
  main: { flex: 1 },
});
