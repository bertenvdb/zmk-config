import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  FlatList,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  createSpool,
  getSpool,
  listFilaments,
  listLocations,
  updateSpool,
} from '../../api/spoolman';
import type {
  SpoolStackParamList,
  SpoolmanFilament,
  SpoolmanLocation,
} from '../../types';
import ColorSwatch from '../../components/ColorSwatch';
import { showToast } from '../../utils/toast';

type Props = NativeStackScreenProps<SpoolStackParamList, 'SpoolCreateEdit'>;

type PickerModal = 'filament' | 'location' | null;

export default function SpoolCreateEditScreen({ route, navigation }: Props) {
  const { spoolId } = route.params ?? {};
  const isEdit = spoolId != null;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pickerModal, setPickerModal] = useState<PickerModal>(null);

  const [filaments, setFilaments] = useState<SpoolmanFilament[]>([]);
  const [locations, setLocations] = useState<SpoolmanLocation[]>([]);
  const [filamentSearch, setFilamentSearch] = useState('');

  const [selectedFilament, setSelectedFilament] = useState<SpoolmanFilament | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<SpoolmanLocation | null>(null);
  const [initialWeight, setInitialWeight] = useState('');
  const [remainingWeight, setRemainingWeight] = useState('');
  const [firstUsed, setFirstUsed] = useState('');
  const [lastUsed, setLastUsed] = useState('');
  const [archived, setArchived] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [fils, locs] = await Promise.all([listFilaments(), listLocations()]);
        setFilaments(fils);
        setLocations(locs);

        if (isEdit && spoolId != null) {
          const spool = await getSpool(spoolId);
          setSelectedFilament(spool.filament);
          setSelectedLocation(spool.location ?? null);
          setInitialWeight(spool.initial_weight?.toFixed(0) ?? '');
          setRemainingWeight(spool.remaining_weight?.toFixed(0) ?? '');
          setFirstUsed(spool.first_used ?? '');
          setLastUsed(spool.last_used ?? '');
          setArchived(spool.archived);
          setNote(spool.comment ?? '');
        }
      } catch (err: unknown) {
        showToast(`Error loading: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [isEdit, spoolId]);

  const handleSave = useCallback(async () => {
    if (!selectedFilament) {
      Alert.alert('Required', 'Select a filament.');
      return;
    }

    const data: Record<string, unknown> = {
      filament_id: selectedFilament.id,
      archived,
    };
    if (selectedLocation) {
      data.location_id = selectedLocation.id;
    }
    if (initialWeight) {
      data.initial_weight = parseFloat(initialWeight);
    }
    if (remainingWeight) {
      data.remaining_weight = parseFloat(remainingWeight);
    }
    if (firstUsed) {
      data.first_used = firstUsed;
    }
    if (lastUsed) {
      data.last_used = lastUsed;
    }
    if (note) {
      data.comment = note;
    }

    setSaving(true);
    try {
      if (isEdit && spoolId != null) {
        await updateSpool(spoolId, data);
        showToast('Spool updated.');
      } else {
        await createSpool(data);
        showToast('Spool created.');
      }
      navigation.goBack();
    } catch (err: unknown) {
      showToast(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSaving(false);
    }
  }, [
    selectedFilament,
    selectedLocation,
    initialWeight,
    remainingWeight,
    firstUsed,
    lastUsed,
    archived,
    note,
    isEdit,
    spoolId,
    navigation,
  ]);

  const filteredFilaments = filamentSearch.trim()
    ? filaments.filter(f => {
        const q = filamentSearch.toLowerCase();
        return (
          f.name?.toLowerCase().includes(q) ||
          f.vendor?.name?.toLowerCase().includes(q) ||
          f.material?.toLowerCase().includes(q)
        );
      })
    : filaments;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">

        {/* Filament picker */}
        <Text style={styles.label}>Filament *</Text>
        <TouchableOpacity
          style={styles.pickerBtn}
          onPress={() => setPickerModal('filament')}>
          {selectedFilament ? (
            <View style={styles.pickerBtnInner}>
              <ColorSwatch hex={selectedFilament.color_hex} size={20} />
              <Text style={styles.pickerBtnText}>
                {[selectedFilament.vendor?.name, selectedFilament.name, selectedFilament.material]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            </View>
          ) : (
            <Text style={styles.pickerBtnPlaceholder}>Select filament…</Text>
          )}
        </TouchableOpacity>

        {/* Location picker */}
        <Text style={styles.label}>Location</Text>
        <TouchableOpacity
          style={styles.pickerBtn}
          onPress={() => setPickerModal('location')}>
          <Text
            style={
              selectedLocation ? styles.pickerBtnText : styles.pickerBtnPlaceholder
            }>
            {selectedLocation ? selectedLocation.name : 'Select location…'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.label}>Initial Weight (g)</Text>
        <TextInput
          style={styles.input}
          value={initialWeight}
          onChangeText={setInitialWeight}
          keyboardType="numeric"
          placeholder="e.g. 1000"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Remaining Weight (g)</Text>
        <TextInput
          style={styles.input}
          value={remainingWeight}
          onChangeText={setRemainingWeight}
          keyboardType="numeric"
          placeholder="e.g. 850"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>First Used</Text>
        <TextInput
          style={styles.input}
          value={firstUsed}
          onChangeText={setFirstUsed}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Last Used</Text>
        <TextInput
          style={styles.input}
          value={lastUsed}
          onChangeText={setLastUsed}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#999"
        />

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Archived</Text>
          <Switch value={archived} onValueChange={setArchived} />
        </View>

        <Text style={styles.label}>Note</Text>
        <TextInput
          style={[styles.input, styles.noteInput]}
          value={note}
          onChangeText={setNote}
          multiline
          numberOfLines={3}
          placeholder="Optional note…"
          placeholderTextColor="#999"
        />

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>
              {isEdit ? 'Save Changes' : 'Create Spool'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Filament picker modal */}
      <Modal
        visible={pickerModal === 'filament'}
        animationType="slide"
        onRequestClose={() => setPickerModal(null)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Filament</Text>
            <TouchableOpacity onPress={() => setPickerModal(null)}>
              <Text style={styles.modalClose}>Done</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.searchInput}
            value={filamentSearch}
            onChangeText={setFilamentSearch}
            placeholder="Search…"
            placeholderTextColor="#999"
            autoFocus
          />
          <FlatList
            data={filteredFilaments}
            keyExtractor={item => String(item.id)}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.pickerItem,
                  selectedFilament?.id === item.id && styles.pickerItemActive,
                ]}
                onPress={() => {
                  setSelectedFilament(item);
                  setPickerModal(null);
                  setFilamentSearch('');
                }}>
                <ColorSwatch hex={item.color_hex} size={20} />
                <Text style={styles.pickerItemText}>
                  {[item.vendor?.name, item.name, item.material]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      {/* Location picker modal */}
      <Modal
        visible={pickerModal === 'location'}
        animationType="slide"
        onRequestClose={() => setPickerModal(null)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Location</Text>
            <TouchableOpacity onPress={() => setPickerModal(null)}>
              <Text style={styles.modalClose}>Done</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.pickerItem, !selectedLocation && styles.pickerItemActive]}
            onPress={() => {
              setSelectedLocation(null);
              setPickerModal(null);
            }}>
            <Text style={styles.pickerItemText}>No Location</Text>
          </TouchableOpacity>
          <FlatList
            data={locations}
            keyExtractor={item => String(item.id)}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.pickerItem,
                  selectedLocation?.id === item.id && styles.pickerItemActive,
                ]}
                onPress={() => {
                  setSelectedLocation(item);
                  setPickerModal(null);
                }}>
                <Text style={styles.pickerItemText}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f2f2f7' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16 },
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
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  noteInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pickerBtn: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  pickerBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pickerBtnText: { fontSize: 15, color: '#111' },
  pickerBtnPlaceholder: { fontSize: 15, color: '#999' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  switchLabel: { fontSize: 15, color: '#111' },
  saveBtn: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  // Modal
  modalContainer: { flex: 1, backgroundColor: '#f2f2f7' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
    backgroundColor: '#fff',
  },
  modalTitle: { fontSize: 17, fontWeight: '700' },
  modalClose: { fontSize: 16, color: '#007AFF', fontWeight: '600' },
  searchInput: {
    backgroundColor: '#fff',
    margin: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  pickerItemActive: { backgroundColor: '#EBF5FF' },
  pickerItemText: { fontSize: 15, color: '#111' },
});
