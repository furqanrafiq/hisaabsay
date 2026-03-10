import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';

interface Props { title: string; subtitle?: string; }

export function EmptyState({ title, subtitle }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>📭</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: Theme.spacing.xxl },
  emoji: { fontSize: 48, marginBottom: Theme.spacing.md },
  title: { fontSize: Theme.fontSize.lg, fontWeight: '600', color: Colors.textPrimary, textAlign: 'center' },
  subtitle: { fontSize: Theme.fontSize.sm, color: Colors.textSecondary, textAlign: 'center', marginTop: 6 },
});
