import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { mobileApi } from '../../shared/api';
import type { MobileSession } from '../../shared/types';

type Props = {
  onAuthenticated: (session: MobileSession) => void;
};

function newSessionId() {
  return `mob-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

export function AuthScreen({ onAuthenticated }: Props) {
  const [mode, setMode] = useState<'password' | 'otp'>('password');
  const [mobile, setMobile] = useState('9000000002');
  const [password, setPassword] = useState('StrongPass#123');
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [area, setArea] = useState('Adirai East');
  const [status, setStatus] = useState('');

  const onPasswordLogin = async () => {
    try {
      const response = await mobileApi.passwordLogin(mobile, password);
      onAuthenticated({
        mobile,
        area,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        sessionId: newSessionId(),
        startedAtMs: Date.now(),
      });
    } catch (err) {
      setStatus((err as Error).message);
    }
  };

  const onRequestOtp = async () => {
    try {
      const response = await mobileApi.requestOtp(mobile);
      setDevOtp(response.otpDevOnly);
      setStatus(`OTP sent. Dev OTP: ${response.otpDevOnly}`);
    } catch (err) {
      setStatus((err as Error).message);
    }
  };

  const onVerifyOtp = async () => {
    try {
      const response = await mobileApi.verifyOtpLogin(mobile, otp);
      onAuthenticated({
        mobile,
        area,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        sessionId: newSessionId(),
        startedAtMs: Date.now(),
      });
    } catch (err) {
      setStatus((err as Error).message);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Login</Text>
      <View style={styles.modeRow}>
        <Pressable style={mode === 'password' ? styles.modeActive : styles.mode} onPress={() => setMode('password')}>
          <Text style={styles.modeText}>Password</Text>
        </Pressable>
        <Pressable style={mode === 'otp' ? styles.modeActive : styles.mode} onPress={() => setMode('otp')}>
          <Text style={styles.modeText}>OTP</Text>
        </Pressable>
      </View>

      <TextInput style={styles.input} value={mobile} onChangeText={setMobile} placeholder="Mobile" />
      <TextInput style={styles.input} value={area} onChangeText={setArea} placeholder="Area" />

      {mode === 'password' ? (
        <>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry
          />
          <Pressable style={styles.button} onPress={onPasswordLogin}>
            <Text style={styles.buttonText}>Login with Password</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Pressable style={styles.button} onPress={onRequestOtp}>
            <Text style={styles.buttonText}>Request OTP</Text>
          </Pressable>
          <TextInput style={styles.input} value={otp} onChangeText={setOtp} placeholder="Enter OTP" />
          <Pressable style={styles.button} onPress={onVerifyOtp}>
            <Text style={styles.buttonText}>Verify OTP</Text>
          </Pressable>
          {devOtp ? <Text style={styles.hint}>Dev OTP: {devOtp}</Text> : null}
        </>
      )}
      {status ? <Text style={styles.status}>{status}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 12, gap: 8 },
  heading: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  modeRow: { flexDirection: 'row', gap: 8 },
  mode: { flex: 1, backgroundColor: '#e2e8f0', borderRadius: 8, padding: 8, alignItems: 'center' },
  modeActive: { flex: 1, backgroundColor: '#0e7490', borderRadius: 8, padding: 8, alignItems: 'center' },
  modeText: { color: '#fff', fontWeight: '700' },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 10, color: '#0f172a' },
  button: { backgroundColor: '#0f766e', borderRadius: 9, paddingVertical: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' },
  hint: { color: '#0369a1', fontSize: 12 },
  status: { color: '#b91c1c', fontSize: 12 },
});

