import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { mobileConfig } from '../../shared/mobile-config';

export function MobileBootstrapCard() {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Admin-Controlled Mobile Settings</Text>
      <Text style={styles.row}>Min Android: {mobileConfig.minAndroidVersion}</Text>
      <Text style={styles.row}>Min iOS: {mobileConfig.minIosVersion}</Text>
      <Text style={styles.row}>Maintenance: {mobileConfig.maintenanceMode ? 'ON' : 'OFF'}</Text>
      <Text style={styles.row}>Force Update: {mobileConfig.forceUpdate ? 'ON' : 'OFF'}</Text>
      <Text style={styles.row}>Push Enabled: {mobileConfig.pushEnabled ? 'ON' : 'OFF'}</Text>

      <Pressable style={styles.button}>
        <Text style={styles.buttonText}>Connect Auth + Feed Next</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 14, gap: 8 },
  heading: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  row: { color: '#334155', fontSize: 14 },
  button: {
    marginTop: 8,
    backgroundColor: '#0e7490',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '700' },
});

