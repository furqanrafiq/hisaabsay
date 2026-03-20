import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  color?: string;
}

export function AppCard({ children, style, color }: Props) {
  return (
    <View style={[styles.card, color ? { backgroundColor: color } : {}, Theme.shadow.card, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Theme.radius.lg,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
