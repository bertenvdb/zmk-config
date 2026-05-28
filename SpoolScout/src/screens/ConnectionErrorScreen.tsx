import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ConnectionErrorScreenProps {
  onRetry: () => void;
  onGoToSettings: () => void;
}

export default function ConnectionErrorScreen({
  onRetry,
  onGoToSettings,
}: ConnectionErrorScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.title}>Cannot Reach Spoolman</Text>
      <Text style={styles.message}>
        Make sure Spoolman is running and your device is on the same network.
      </Text>
      <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
        <Text style={styles.retryBtnText}>Retry</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.settingsBtn} onPress={onGoToSettings}>
        <Text style={styles.settingsBtnText}>Open Settings</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#f2f2f7',
  },
  icon: { fontSize: 56, marginBottom: 16 },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  retryBtn: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 12,
    marginBottom: 12,
  },
  retryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  settingsBtn: {
    paddingVertical: 14,
    paddingHorizontal: 48,
  },
  settingsBtnText: { color: '#007AFF', fontSize: 16, fontWeight: '600' },
});
