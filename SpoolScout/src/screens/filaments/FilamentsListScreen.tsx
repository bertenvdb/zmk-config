import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import ColorSwatch from '../../components/ColorSwatch';
import { listFilaments } from '../../api/spoolman';
import type { SpoolmanFilament } from '../../types';
import { showToast } from '../../utils/toast';

export default function FilamentsListScreen() {
  const [filaments, setFilaments] = useState<SpoolmanFilament[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listFilaments();
      setFilaments(data);
    } catch (err: unknown) {
      showToast(`Failed to load filaments: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const renderItem = ({ item }: { item: SpoolmanFilament }) => {
    const temps: string[] = [];
    if (item.settings_extruder_temp != null) {
      temps.push(`${item.settings_extruder_temp} °C`);
    }

    return (
      <View style={styles.item}>
        <ColorSwatch hex={item.color_hex} size={32} />
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name ?? '(unnamed)'}</Text>
          <Text style={styles.itemSub}>
            {[item.vendor?.name, item.material].filter(Boolean).join(' · ')}
          </Text>
          {temps.length > 0 && (
            <Text style={styles.itemTemp}>{temps.join(' / ')}</Text>
          )}
        </View>
      </View>
    );
  };

  if (loading && filaments.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      data={filaments}
      keyExtractor={item => String(item.id)}
      renderItem={renderItem}
      ListEmptyComponent={<Text style={styles.empty}>No filaments found.</Text>}
      refreshing={loading}
      onRefresh={load}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: '#f2f2f7' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { textAlign: 'center', marginTop: 60, color: '#999', fontSize: 15 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', color: '#111' },
  itemSub: { fontSize: 13, color: '#666', marginTop: 2 },
  itemTemp: { fontSize: 12, color: '#999', marginTop: 2 },
});
