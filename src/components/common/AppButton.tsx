import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function AppButton({ title, onPress, variant = 'primary', loading, disabled, style }: Props) {
  return (
    <TouchableOpacity
      style={[styles.base, styles[variant], (disabled || loading) && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? Colors.textOnPrimary : Colors.primary} />
      ) : (
        <Text style={[styles.text, variant !== 'primary' && styles.textDark]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: Theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Theme.spacing.lg,
  },
  primary: { backgroundColor: Colors.primary },
  secondary: { backgroundColor: Colors.cardMint, borderWidth: 1, borderColor: Colors.primary },
  ghost: { backgroundColor: 'transparent' },
  disabled: { opacity: 0.5 },
  text: { fontSize: Theme.fontSize.md, fontWeight: '600', color: Colors.textOnPrimary },
  textDark: { color: Colors.primary },
});
