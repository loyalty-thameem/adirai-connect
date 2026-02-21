import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { mobileApi } from '../../shared/api';

type Props = {
  onScreenViewed: (screen: string) => void;
  onLogoutCurrent: () => void;
  onLogoutAllDevices: () => void;
};

export function SettingsScreen({ onScreenViewed, onLogoutCurrent, onLogoutAllDevices }: Props) {
  const [runtimeConfig, setRuntimeConfig] = useState<Record<string, unknown> | null>(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    onScreenViewed('settings');
    const load = async () => {
      try {
        const config = await mobileApi.getMobileRuntimeConfig();
        setRuntimeConfig(config);
      } catch (err) {
        setStatus((err as Error).message);
      }
    };
    void load();
  }, [onScreenViewed]);

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Settings</Text>
      {runtimeConfig ? <Text style={styles.text}>{JSON.stringify(runtimeConfig, null, 2)}</Text> : null}
      {status ? <Text style={styles.error}>{status}</Text> : null}
      <Pressable style={styles.button} onPress={onLogoutCurrent}>
        <Text style={styles.buttonText}>Logout Current Device</Text>
      </Pressable>
      <Pressable style={styles.buttonDanger} onPress={onLogoutAllDevices}>
        <Text style={styles.buttonText}>Logout All Devices</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 12, gap: 10 },
  heading: { fontSize: 17, fontWeight: '700', color: '#0f172a' },
  text: { color: '#334155', fontSize: 12 },
  error: { color: '#b91c1c', fontSize: 12 },
  button: { backgroundColor: '#334155', borderRadius: 9, paddingVertical: 10, alignItems: 'center' },
  buttonDanger: { backgroundColor: '#b91c1c', borderRadius: 9, paddingVertical: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' },
});
