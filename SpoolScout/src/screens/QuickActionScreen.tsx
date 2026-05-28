import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import ColorSwatch from '../components/ColorSwatch';
import WeightInput from '../components/WeightInput';
import { getSpool, listSpools, listLocations, updateSpool } from '../api/spoolman';
import { getActiveSpool, setActiveSpool } from '../api/moonraker';
import type {
  OpenSpoolTag,
  RootStackParamList,
  SpoolmanLocation,
  SpoolmanSpool,
} from '../types';
import { showToast } from '../utils/toast';

type Props = NativeStackScreenProps<RootStackParamList, 'QuickAction'> & {
  moonrakerConfigured: boolean;
};

export default function QuickActionScreen({ route, moonrakerConfigured }: Props) {
  const { tag } = route.params;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [spool, setSpool] = useState<SpoolmanSpool | null>(null);
  const [disambiguationList, setDisambiguationList] = useState<SpoolmanSpool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weightInput, setWeightInput] = useState('');
  const [locations, setLocations] = useState<SpoolmanLocation[]>([]);
  const [activeMoonrakerSpoolId, setActiveMoonrakerSpoolId] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        let foundSpool: SpoolmanSpool | null = null;

        if (tag.spoolman_id != null) {
          foundSpool = await getSpool(tag.spoolman_id);
        } else {
          // Fallback: match on type + color_hex + brand
          const allSpools = await listSpools();
          const matches = allSpools.filter(s => {
            const f = s.filament;
            return (
              f.material === tag.type &&
              f.color_hex === tag.color_hex
            );
          });
          if (matches.length === 1) {
            foundSpool = matches[0];
          } else if (matches.length > 1) {
            setDisambiguationList(matches);
          }
        }

        if (!foundSpool) {
          setError('Spool not found in Spoolman.');
          return;
        }

        setSpool(foundSpool);
        setWeightInput(
          foundSpool.remaining_weight != null
            ? String(foundSpool.remaining_weight)
            : '',
        );

        const [locs, activeId] = await Promise.all([
          listLocations(),
          moonrakerConfigured
            ? getActiveSpool().catch(() => null)
            : Promise.resolve(null),
        ]);
        setLocations(locs);
        setActiveMoonrakerSpoolId(activeId);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [tag, moonrakerConfigured]);

  const handleUpdateWeight = useCallback(async () => {
    if (!spool) { return; }
    const grams = parseFloat(weightInput);
    if (isNaN(grams) || grams < 0) {
      showToast('Enter a valid weight in grams.');
      return;
    }
    setActionLoading(true);
    try {
      const updated = await updateSpool(spool.id, { remaining_weight: grams });
      setSpool(updated);
      showToast('Weight updated.');
    } catch (err: unknown) {
      showToast(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setActionLoading(false);
    }
  }, [spool, weightInput]);

  const handleSelectLocation = useCallback(async (location: SpoolmanLocation) => {
    if (!spool) { return; }
    setActionLoading(true);
    try {
      const updated = await updateSpool(spool.id, { location_id: location.id });
      setSpool(updated);
      showToast('Location updated.');
    } catch (err: unknown) {
      showToast(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setActionLoading(false);
    }
  }, [spool]);

  const handleToggleActive = useCallback(async () => {
    if (!spool) { return; }
    const isActive = activeMoonrakerSpoolId === spool.id;
    setActionLoading(true);
    try {
      await setActiveSpool(isActive ? null : spool.id);
      setActiveMoonrakerSpoolId(isActive ? null : spool.id);
      showToast(isActive ? 'Spool set inactive.' : 'Spool set as active.');
    } catch (err: unknown) {
      showToast(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setActionLoading(false);
    }
  }, [spool, activeMoonrakerSpoolId]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading spool…</Text>
      </View>
    );
  }

  if (!loading && disambiguationList.length > 1) {
    return (
      <View style={styles.container}>
        <View style={styles.handle} />
        <Text style={[styles.sectionTitle, { paddingHorizontal: 16, paddingTop: 16 }]}>
          Multiple Matching Spools
        </Text>
        <Text style={styles.disambigHint}>
          This tag matches {disambiguationList.length} spools. Select one:
        </Text>
        <ScrollView>
          {disambiguationList.map(s => (
            <TouchableOpacity
              key={s.id}
              style={styles.disambigItem}
              onPress={() => {
                setSpool(s);
                setDisambiguationList([]);
                setWeightInput(
                  s.remaining_weight != null ? String(s.remaining_weight) : '',
                );
              }}>
              <ColorSwatch hex={s.filament.color_hex} size={32} />
              <View style={{ flex: 1 }}>
                <Text style={styles.disambigName}>
                  {s.filament.name ?? s.filament.material ?? 'Unknown'}
                </Text>
                <Text style={styles.disambigSub}>
                  {s.filament.vendor?.name ?? ''}{s.location?.name ? ` · ${s.location.name}` : ''}
                </Text>
                <Text style={styles.disambigWeight}>
                  {s.remaining_weight != null ? `${s.remaining_weight.toFixed(0)} g` : '— g'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity
          style={[styles.closeBtn, { margin: 16 }]}
          onPress={() => navigation.goBack()}>
          <Text style={styles.closeBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (error || !spool) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorIcon}>❌</Text>
        <Text style={styles.errorTitle}>Spool Not Found</Text>
        <Text style={styles.errorMessage}>{error ?? 'No matching spool in Spoolman.'}</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.closeBtnText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { filament } = spool;
  const isActive = activeMoonrakerSpoolId === spool.id;

  return (
    <View style={styles.container}>
      <View style={styles.handle} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Summary */}
        <View style={styles.summary}>
          <ColorSwatch hex={filament.color_hex} size={52} />
          <View style={styles.summaryInfo}>
            <Text style={styles.summaryMaterial}>
              {filament.material ?? '—'} · {filament.vendor?.name ?? '—'}
            </Text>
            <Text style={styles.summaryHex}>#{filament.color_hex ?? '000000'}</Text>
            <Text style={styles.summaryWeight}>
              {spool.remaining_weight != null
                ? `${spool.remaining_weight.toFixed(0)} g remaining`
                : 'Weight unknown'}
            </Text>
            {spool.location?.name ? (
              <Text style={styles.summaryLocation}>📍 {spool.location.name}</Text>
            ) : null}
          </View>
        </View>

        <TouchableOpacity
          style={styles.detailsBtn}
          onPress={() => navigation.goBack()}>
          <Text style={styles.detailsBtnText}>Close</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Update weight */}
        <Text style={styles.sectionTitle}>Update Weight</Text>
        <WeightInput value={weightInput} onChange={setWeightInput} />
        <TouchableOpacity
          style={[styles.btn, actionLoading && styles.btnDisabled]}
          onPress={handleUpdateWeight}
          disabled={actionLoading}>
          <Text style={styles.btnText}>Update Weight</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Update location */}
        <Text style={styles.sectionTitle}>Update Location</Text>
        {locations.length === 0 ? (
          <Text style={styles.emptyText}>No locations available.</Text>
        ) : (
          locations.map(loc => (
            <TouchableOpacity
              key={loc.id}
              style={[
                styles.locationItem,
                spool.location?.id === loc.id && styles.locationItemActive,
              ]}
              onPress={() => handleSelectLocation(loc)}
              disabled={actionLoading}>
              <Text
                style={[
                  styles.locationItemText,
                  spool.location?.id === loc.id && styles.locationItemTextActive,
                ]}>
                {loc.name}
              </Text>
            </TouchableOpacity>
          ))
        )}

        {/* Moonraker actions */}
        {moonrakerConfigured && (
          <>
            <View style={styles.divider} />
            <TouchableOpacity
              style={[
                styles.btn,
                isActive ? styles.btnDanger : styles.btnPrimary,
                actionLoading && styles.btnDisabled,
              ]}
              onPress={handleToggleActive}
              disabled={actionLoading}>
              <Text style={styles.btnText}>
                {isActive ? 'Set Inactive' : 'Set as Active Spool'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#f8f8f8',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#ccc',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  content: { padding: 16, paddingBottom: 40 },
  summary: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  summaryInfo: { flex: 1 },
  summaryMaterial: { fontSize: 16, fontWeight: '600', color: '#111' },
  summaryHex: { fontSize: 13, color: '#666', marginTop: 2 },
  summaryWeight: { fontSize: 14, color: '#333', marginTop: 4 },
  summaryLocation: { fontSize: 13, color: '#666', marginTop: 2 },
  detailsBtn: { paddingVertical: 6, marginBottom: 4 },
  detailsBtnText: { fontSize: 14, color: '#007AFF', fontWeight: '600' },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#ddd',
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  btn: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  btnPrimary: { backgroundColor: '#007AFF' },
  btnDanger: { backgroundColor: '#FF3B30' },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  locationItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  locationItemActive: { borderColor: '#007AFF', backgroundColor: '#EBF5FF' },
  locationItemText: { fontSize: 15, color: '#333' },
  locationItemTextActive: { color: '#007AFF', fontWeight: '600' },
  emptyText: { fontSize: 14, color: '#999', fontStyle: 'italic' },
  loadingText: { marginTop: 12, color: '#666', fontSize: 14 },
  errorIcon: { fontSize: 48, marginBottom: 12 },
  errorTitle: { fontSize: 20, fontWeight: '700', color: '#111', marginBottom: 8 },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  closeBtn: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
  closeBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  disambigHint: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    fontSize: 14,
    color: '#666',
  },
  disambigItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  disambigName: { fontSize: 15, fontWeight: '600', color: '#111' },
  disambigSub: { fontSize: 13, color: '#666', marginTop: 2 },
  disambigWeight: { fontSize: 13, color: '#999', marginTop: 2 },
});
