import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MobileBootstrapCard } from './src/features/bootstrap/MobileBootstrapCard';

export default function App() {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Adirai Connect Mobile</Text>
          <Text style={styles.title}>Mobile Baseline Config</Text>
        </View>
        <MobileBootstrapCard />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#ecfeff' },
  content: { padding: 16, gap: 12 },
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
});

