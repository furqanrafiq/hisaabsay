import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps } from 'react-native';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
}

export function AppInput({ label, error, style, ...props }: Props) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, focused && styles.focused, error && styles.errored, style]}
        placeholderTextColor={Colors.textSecondary}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: Theme.spacing.md },
  label: { fontSize: Theme.fontSize.sm, fontWeight: '500', color: Colors.textSecondary, marginBottom: 6 },
  input: {
    height: 52,
    backgroundColor: Colors.cardMint,
    borderRadius: Theme.radius.md,
    paddingHorizontal: Theme.spacing.md,
    fontSize: Theme.fontSize.md,
    color: Colors.textPrimary,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  focused: { borderColor: Colors.primary, backgroundColor: Colors.card },
  errored: { borderColor: Colors.error },
  error: { fontSize: Theme.fontSize.xs, color: Colors.error, marginTop: 4 },
});
