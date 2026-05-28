import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import NfcManager from 'react-native-nfc-manager';
import ColorSwatch from '../../components/ColorSwatch';
import { deleteSpool, getSpool } from '../../api/spoolman';
import { writeSpoolToTag } from '../../nfc/writer';
import type { SpoolStackParamList, SpoolmanSpool } from '../../types';
import { showToast } from '../../utils/toast';

type Props = NativeStackScreenProps<SpoolStackParamList, 'SpoolDetail'>;

function FieldRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) {
    return null;
  }
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default function SpoolDetailScreen({ route, navigation }: Props) {
  const { spoolId } = route.params;
  const [spool, setSpool] = useState<SpoolmanSpool | null>(null);
  const [loading, setLoading] = useState(true);
  const [nfcWriting, setNfcWriting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSpool(spoolId);
      setSpool(data);
    } catch (err: unknown) {
      showToast(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }, [spoolId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Spool',
      'This will permanently delete the spool from Spoolman.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSpool(spoolId);
              navigation.goBack();
              showToast('Spool deleted.');
            } catch (err: unknown) {
              showToast(`Error: ${err instanceof Error ? err.message : String(err)}`);
            }
          },
        },
      ],
    );
  }, [spoolId, navigation]);

  const handleWriteNfc = useCallback(async () => {
    if (!spool) {
      return;
    }

    const isSupported = await NfcManager.isSupported();
    if (!isSupported) {
      Alert.alert('NFC Unavailable', 'This device does not support NFC.');
      return;
    }

    setNfcWriting(true);
    Alert.alert(
      'Write NFC Tag',
      'Hold an NFC tag against the back of your phone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            NfcManager.cancelTechnologyRequest().catch(() => {});
            setNfcWriting(false);
          },
        },
      ],
      { cancelable: false },
    );

    try {
      await writeSpoolToTag(spool);
      Alert.alert('Success', 'NFC tag written successfully.');
    } catch (err: unknown) {
      Alert.alert(
        'Write Failed',
        err instanceof Error ? err.message : String(err),
      );
    } finally {
      setNfcWriting(false);
    }
  }, [spool]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!spool) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Spool not found.</Text>
      </View>
    );
  }

  const { filament } = spool;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <ColorSwatch hex={filament.color_hex} size={64} />
        <View style={styles.heroText}>
          <Text style={styles.heroName}>{filament.name ?? 'Unknown Filament'}</Text>
          <Text style={styles.heroSub}>
            {[filament.vendor?.name, filament.material]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <FieldRow
          label="Remaining"
          value={
            spool.remaining_weight != null
              ? `${spool.remaining_weight.toFixed(0)} g`
              : undefined
          }
        />
        <FieldRow
          label="Initial Weight"
          value={
            spool.initial_weight != null
              ? `${spool.initial_weight.toFixed(0)} g`
              : undefined
          }
        />
        <FieldRow label="Location" value={spool.location?.name} />
        <FieldRow label="First Used" value={spool.first_used ?? undefined} />
        <FieldRow label="Last Used" value={spool.last_used ?? undefined} />
        <FieldRow label="Note" value={spool.comment ?? undefined} />
        <FieldRow label="Color" value={filament.color_hex ? `#${filament.color_hex}` : undefined} />
        <FieldRow
          label="Extruder Temp"
          value={
            filament.settings_extruder_temp != null
              ? `${filament.settings_extruder_temp} °C`
              : undefined
          }
        />
        {spool.archived && <FieldRow label="Status" value="Archived" />}
      </View>

      <TouchableOpacity
        style={styles.editBtn}
        onPress={() => navigation.navigate('SpoolCreateEdit', { spoolId })}>
        <Text style={styles.editBtnText}>Edit Spool</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.nfcBtn, nfcWriting && styles.nfcBtnDisabled]}
        onPress={handleWriteNfc}
        disabled={nfcWriting}>
        <Text style={styles.nfcBtnText}>
          {nfcWriting ? 'Waiting for tag…' : 'Write NFC Tag'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
        <Text style={styles.deleteBtnText}>Delete Spool</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f7' },
  content: { padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  heroText: { flex: 1 },
  heroName: { fontSize: 18, fontWeight: '700', color: '#111' },
  heroSub: { fontSize: 14, color: '#666', marginTop: 4 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  rowLabel: { fontSize: 15, color: '#666' },
  rowValue: { fontSize: 15, color: '#111', fontWeight: '500', maxWidth: '60%', textAlign: 'right' },
  editBtn: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  editBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  nfcBtn: {
    backgroundColor: '#34C759',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  nfcBtnDisabled: { opacity: 0.6 },
  nfcBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  deleteBtn: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF3B30',
    marginBottom: 10,
  },
  deleteBtnText: { color: '#FF3B30', fontSize: 16, fontWeight: '700' },
  errorText: { color: '#999', fontSize: 15 },
});
