import React, { useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
} from 'react-native';

/**
 * WeightInput accepts either a manually entered value or a value pushed from an
 * external source (e.g. Bluetooth scale via externalValueSource).
 */
export interface WeightValueSource {
  subscribe(callback: (grams: number) => void): () => void;
}

interface WeightInputProps {
  value: string;
  onChange: (value: string) => void;
  externalValueSource?: WeightValueSource;
  placeholder?: string;
  inputProps?: TextInputProps;
}

export default function WeightInput({
  value,
  onChange,
  externalValueSource,
  placeholder = '0',
  inputProps,
}: WeightInputProps) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!externalValueSource) {
      return;
    }
    return externalValueSource.subscribe((grams) => {
      onChangeRef.current(String(grams));
    });
  }, [externalValueSource]);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        keyboardType="numeric"
        placeholder={placeholder}
        placeholderTextColor="#999"
        {...inputProps}
      />
      <Text style={styles.unit}>g</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111',
    padding: 0,
  },
  unit: {
    fontSize: 16,
    color: '#666',
    marginLeft: 4,
  },
});
