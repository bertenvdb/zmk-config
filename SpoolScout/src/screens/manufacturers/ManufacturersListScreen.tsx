import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { listVendors } from '../../api/spoolman';
import { getAllBrandOverrides } from '../../storage/preferences';
import type { ManufacturerStackParamList, SpoolmanVendor } from '../../types';
import { showToast } from '../../utils/toast';

type Props = NativeStackScreenProps<ManufacturerStackParamList, 'ManufacturersList'>;

export default function ManufacturersListScreen({ navigation }: Props) {
  const [vendors, setVendors] = useState<SpoolmanVendor[]>([]);
  const [overrides, setOverrides] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [vendorList, overrideMap] = await Promise.all([
        listVendors(),
        getAllBrandOverrides(),
      ]);
      setVendors(vendorList);
      setOverrides(overrideMap);
    } catch (err: unknown) {
      showToast(`Failed to load: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (loading && vendors.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      data={vendors}
      keyExtractor={item => String(item.id)}
      renderItem={({ item }) => {
        const override = overrides[item.id];
        return (
          <TouchableOpacity
            style={styles.item}
            onPress={() =>
              navigation.navigate('ManufacturerOverride', {
                vendorId: item.id,
                vendorName: item.name,
              })
            }>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              {override ? (
                <Text style={styles.itemOverride}>OpenSpool brand: {override}</Text>
              ) : (
                <Text style={styles.itemNoOverride}>No override set</Text>
              )}
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        );
      }}
      ListEmptyComponent={
        <Text style={styles.empty}>No manufacturers found.</Text>
      }
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
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', color: '#111' },
  itemOverride: { fontSize: 13, color: '#007AFF', marginTop: 2 },
  itemNoOverride: { fontSize: 13, color: '#999', marginTop: 2 },
  chevron: { fontSize: 20, color: '#ccc' },
});
