import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getBrandOverride, setBrandOverride } from '../../storage/preferences';
import type { ManufacturerStackParamList } from '../../types';
import { showToast } from '../../utils/toast';

type Props = NativeStackScreenProps<ManufacturerStackParamList, 'ManufacturerOverride'>;

const BAMBU_KNOWN_BRANDS = [
  'Generic',
  'Overture',
  'PolyLite',
  'eSun',
  'PolyTerra',
];

export default function ManufacturerOverrideScreen({ route, navigation }: Props) {
  const { vendorId, vendorName } = route.params;
  const [override, setOverride] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getBrandOverride(vendorId).then(val => setOverride(val ?? ''));
  }, [vendorId]);

  const resolvedBrand = override.trim() || vendorName;
  const isKnown = BAMBU_KNOWN_BRANDS.includes(resolvedBrand);
  const effectiveBrand = isKnown ? resolvedBrand : 'Generic';

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await setBrandOverride(vendorId, override);
      showToast('Override saved.');
      navigation.goBack();
    } catch (err: unknown) {
      showToast(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSaving(false);
    }
  }, [vendorId, override, navigation]);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">

        <Text style={styles.sectionLabel}>Spoolman Manufacturer</Text>
        <Text style={styles.vendorName}>{vendorName}</Text>

        <Text style={styles.label}>OpenSpool Brand Override</Text>
        <TextInput
          style={styles.input}
          value={override}
          onChangeText={setOverride}
          placeholder={vendorName}
          placeholderTextColor="#999"
          autoCorrect={false}
        />
        <Text style={styles.hint}>
          Leave blank to use the Spoolman name as-is. Unknown brands fall back to
          "Generic" when writing NFC tags.
        </Text>

        <Text style={styles.label}>Brand Fallback Chain</Text>
        <View style={styles.chainRow}>
          <Text style={[styles.chainStep, override.trim() ? styles.chainActive : styles.chainInactive]}>
            {override.trim() || '(no override)'}
          </Text>
          <Text style={styles.chainArrow}>→</Text>
          <Text style={[styles.chainStep, !override.trim() && vendorName ? styles.chainActive : styles.chainInactive]}>
            {vendorName}
          </Text>
          <Text style={styles.chainArrow}>→</Text>
          <Text style={[styles.chainStep, !isKnown ? styles.chainFallback : styles.chainInactive]}>
            Generic
          </Text>
        </View>
        <Text style={styles.chainHint}>
          NFC tag will use: <Text style={styles.chainResult}>{effectiveBrand}</Text>
        </Text>

        <Text style={styles.label}>BambuStudio Known Brands</Text>
        <Text style={styles.knownList}>{BAMBU_KNOWN_BRANDS.join(', ')}</Text>

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Save Override</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f2f2f7' },
  content: { padding: 20 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  vendorName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginBottom: 20,
    lineHeight: 18,
  },
  chainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 6,
    gap: 4,
  },
  chainStep: {
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
  },
  chainActive: {
    backgroundColor: '#D4EDDA',
    color: '#155724',
  },
  chainInactive: {
    backgroundColor: '#f0f0f0',
    color: '#999',
  },
  chainFallback: {
    backgroundColor: '#FFF3CD',
    color: '#856404',
  },
  chainArrow: {
    fontSize: 14,
    color: '#999',
  },
  chainHint: {
    fontSize: 13,
    color: '#666',
    marginBottom: 20,
  },
  chainResult: {
    fontWeight: '700',
    color: '#111',
  },
  knownList: {
    fontSize: 13,
    color: '#666',
    marginBottom: 28,
    lineHeight: 20,
  },
  saveBtn: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
