import React, { useCallback, useEffect, useState } from 'react';
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
import SpoolCard from '../../components/SpoolCard';
import { listSpools } from '../../api/spoolman';
import type { SpoolStackParamList } from '../../types';
import { showToast } from '../../utils/toast';

type Props = NativeStackScreenProps<SpoolStackParamList, 'SpoolsList'>;

export default function SpoolsListScreen({ navigation }: Props) {
  const [spools, setSpools] = useState<ReturnType<typeof listSpools> extends Promise<infer T> ? T : never>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listSpools();
      setSpools(data);
    } catch (err: unknown) {
      showToast(`Failed to load spools: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (loading && spools.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <FlatList
        data={spools}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => (
          <SpoolCard
            spool={item}
            onPress={() => navigation.navigate('SpoolDetail', { spoolId: item.id })}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No spools found. Tap + to add one.</Text>
        }
        refreshing={loading}
        onRefresh={load}
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('SpoolCreateEdit', {})}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f2f2f7' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: {
    textAlign: 'center',
    marginTop: 60,
    color: '#999',
    fontSize: 15,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 28,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 30, fontWeight: '300' },
});
