import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ColorSwatch from '../ColorSwatch';
import WeightInput from '../WeightInput';
import * as SpoolmanApi from '../../api/spoolman';
import * as MoonrakerApi from '../../api/moonraker';
import { listLocations, updateSpool } from '../../api/spoolman';
import type { SpoolmanLocation, SpoolmanSpool } from '../../types';
import { showToast } from '../../utils/toast';

const SHEET_HEIGHT = Dimensions.get('window').height * 0.75;

interface QuickActionSheetProps {
  spool: SpoolmanSpool;
  visible: boolean;
  onClose: () => void;
  onNavigateToDetail: (spoolId: number) => void;
  moonrakerConfigured: boolean;
}

export default function QuickActionSheet({
  spool: initialSpool,
  visible,
  onClose,
  onNavigateToDetail,
  moonrakerConfigured,
}: QuickActionSheetProps) {
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const [spool, setSpool] = useState(initialSpool);
  const [weightInput, setWeightInput] = useState('');
  const [locations, setLocations] = useState<SpoolmanLocation[]>([]);
  const [activeMoonrakerSpoolId, setActiveMoonrakerSpoolId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSpool(initialSpool);
    setWeightInput(
      initialSpool.remaining_weight != null
        ? String(initialSpool.remaining_weight)
        : '',
    );
  }, [initialSpool]);

  useEffect(() => {
    if (!visible) {
      return;
    }
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 0,
    }).start();

    listLocations()
      .then(setLocations)
      .catch(() => {});

    if (moonrakerConfigured) {
      MoonrakerApi.getActiveSpool()
        .then(setActiveMoonrakerSpoolId)
        .catch(() => setActiveMoonrakerSpoolId(null));
    }
  }, [visible, moonrakerConfigured, translateY]);

  const handleClose = useCallback(() => {
    Animated.timing(translateY, {
      toValue: SHEET_HEIGHT,
      duration: 220,
      useNativeDriver: true,
    }).start(() => onClose());
  }, [translateY, onClose]);

  const handleUpdateWeight = async () => {
    const grams = parseFloat(weightInput);
    if (isNaN(grams) || grams < 0) {
      showToast('Enter a valid weight in grams.');
      return;
    }
    setLoading(true);
    try {
      const updated = await SpoolmanApi.updateSpool(spool.id, {
        remaining_weight: grams,
      });
      setSpool(updated);
      showToast('Weight updated.');
    } catch (err: unknown) {
      showToast(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLocation = async (location: SpoolmanLocation) => {
    setLoading(true);
    try {
      const updated = await updateSpool(spool.id, { location_id: location.id });
      setSpool(updated);
      showToast('Location updated.');
    } catch (err: unknown) {
      showToast(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async () => {
    const isActive = activeMoonrakerSpoolId === spool.id;
    setLoading(true);
    try {
      await MoonrakerApi.setActiveSpool(isActive ? null : spool.id);
      setActiveMoonrakerSpoolId(isActive ? null : spool.id);
      showToast(isActive ? 'Spool set inactive.' : 'Spool set as active.');
    } catch (err: unknown) {
      showToast(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const isActive = activeMoonrakerSpoolId === spool.id;
  const filament = spool.filament;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose} />
      <Animated.View
        style={[styles.sheet, { transform: [{ translateY }] }]}>
        <View style={styles.handle} />
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled">
          {/* Summary */}
          <View style={styles.summary}>
            <ColorSwatch hex={filament.color_hex} size={48} />
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
                <Text style={styles.summaryLocation}>
                  📍 {spool.location.name}
                </Text>
              ) : null}
            </View>
          </View>

          <TouchableOpacity
            style={styles.detailsBtn}
            onPress={() => {
              handleClose();
              onNavigateToDetail(spool.id);
            }}>
            <Text style={styles.detailsBtnText}>View Details →</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Update weight */}
          <Text style={styles.sectionTitle}>Update Weight</Text>
          <WeightInput value={weightInput} onChange={setWeightInput} />
          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleUpdateWeight}
            disabled={loading}>
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
                disabled={loading}>
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
                  loading && styles.btnDisabled,
                ]}
                onPress={handleToggleActive}
                disabled={loading}>
                <Text style={styles.btnText}>
                  {isActive ? 'Set Inactive' : 'Set as Active Spool'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    backgroundColor: '#f8f8f8',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#ccc',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryMaterial: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  summaryHex: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  summaryWeight: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
  },
  summaryLocation: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  detailsBtn: {
    paddingVertical: 6,
    marginBottom: 4,
  },
  detailsBtnText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
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
  btnPrimary: {
    backgroundColor: '#007AFF',
  },
  btnDanger: {
    backgroundColor: '#FF3B30',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  locationItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  locationItemActive: {
    borderColor: '#007AFF',
    backgroundColor: '#EBF5FF',
  },
  locationItemText: {
    fontSize: 15,
    color: '#333',
  },
  locationItemTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
});
