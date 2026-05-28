import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import ColorSwatch from '../ColorSwatch';
import type { SpoolmanSpool } from '../../types';

interface SpoolCardProps {
  spool: SpoolmanSpool;
  onPress: () => void;
}

export default function SpoolCard({ spool, onPress }: SpoolCardProps) {
  const { filament } = spool;
  const name = filament.name ?? 'Unknown Filament';
  const manufacturer = filament.vendor?.name ?? '';
  const material = filament.material ?? '';
  const weight =
    spool.remaining_weight != null
      ? `${spool.remaining_weight.toFixed(0)} g`
      : '— g';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <ColorSwatch hex={filament.color_hex} size={36} />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          {[manufacturer, material].filter(Boolean).join(' · ')}
        </Text>
      </View>
      <Text style={styles.weight}>{weight}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
    gap: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
  },
  sub: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  weight: {
    fontSize: 14,
    color: '#333',
    fontVariant: ['tabular-nums'],
  },
});
