import React from 'react';
import { View, StyleSheet } from 'react-native';

interface ColorSwatchProps {
  hex?: string | null;
  size?: number;
}

export default function ColorSwatch({ hex, size = 24 }: ColorSwatchProps) {
  const color = hex ? `#${hex.replace('#', '')}` : '#cccccc';
  return (
    <View
      style={[
        styles.swatch,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  swatch: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
  },
});
