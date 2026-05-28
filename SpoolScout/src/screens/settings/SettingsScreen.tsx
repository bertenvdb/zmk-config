import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { getSettings, saveSettings } from '../../storage/preferences';
import { pingSpoolman, setSpoolmanBaseUrl } from '../../api/spoolman';
import { pingMoonraker, setMoonrakerBaseUrl } from '../../api/moonraker';
import { showToast } from '../../utils/toast';

export default function SettingsScreen() {
  const [spoolmanUrl, setSpoolmanUrl] = useState('');
  const [moonrakerUrl, setMoonrakerUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSettings().then(s => {
      setSpoolmanUrl(s.spoolmanUrl);
      setMoonrakerUrl(s.moonrakerUrl);
    });
  }, []);

  const handleSave = useCallback(async () => {
    const trimmedSpoolman = spoolmanUrl.trim();
    const trimmedMoonraker = moonrakerUrl.trim();

    if (!trimmedSpoolman) {
      Alert.alert('Required', 'Spoolman URL is required.');
      return;
    }

    setSaving(true);
    try {
      const spoolmanOk = await pingSpoolman(trimmedSpoolman);
      if (!spoolmanOk) {
        Alert.alert(
          'Connection Failed',
          `Cannot reach Spoolman at:\n${trimmedSpoolman}\n\nCheck the URL and try again.`,
        );
        return;
      }

      if (trimmedMoonraker) {
        const moonrakerOk = await pingMoonraker(trimmedMoonraker);
        if (!moonrakerOk) {
          const proceed = await new Promise<boolean>(resolve =>
            Alert.alert(
              'Moonraker Unreachable',
              `Cannot reach Moonraker at:\n${trimmedMoonraker}\n\nSave anyway?`,
              [
                { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
                { text: 'Save Anyway', onPress: () => resolve(true) },
              ],
              { cancelable: false },
            ),
          );
          if (!proceed) {
            return;
          }
        }
      }

      await saveSettings({ spoolmanUrl: trimmedSpoolman, moonrakerUrl: trimmedMoonraker });
      setSpoolmanBaseUrl(trimmedSpoolman);
      setMoonrakerBaseUrl(trimmedMoonraker);
      showToast('Settings saved.');
    } catch (err: unknown) {
      showToast(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSaving(false);
    }
  }, [spoolmanUrl, moonrakerUrl]);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Spoolman URL *</Text>
        <TextInput
          style={styles.input}
          value={spoolmanUrl}
          onChangeText={setSpoolmanUrl}
          placeholder="http://192.168.1.10:7912"
          placeholderTextColor="#999"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />

        <Text style={styles.label}>Moonraker URL</Text>
        <TextInput
          style={styles.input}
          value={moonrakerUrl}
          onChangeText={setMoonrakerUrl}
          placeholder="http://192.168.1.10:7125"
          placeholderTextColor="#999"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
        <Text style={styles.hint}>
          Leave blank to disable Moonraker integration.
        </Text>

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Save & Connect</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f2f2f7' },
  container: { padding: 20 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: -10,
    marginBottom: 24,
  },
  saveBtn: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
