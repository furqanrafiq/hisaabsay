import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Goal } from '@/types';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { formatCurrency } from '@/utils/formatCurrency';
import { ProgressBar } from '@/components/common/ProgressBar';
import { AppCard } from '@/components/common/AppCard';

interface Props { goal: Goal; currency: string; }

export function GoalCard({ goal, currency }: Props) {
  const pct = goal.targetAmount > 0 ? Math.round((goal.savedAmount / goal.targetAmount) * 100) : 0;
  return (
    <AppCard style={styles.card}>
      <Text style={styles.emoji}>{goal.emoji}</Text>
      <Text style={styles.name} numberOfLines={1}>{goal.name}</Text>
      <Text style={styles.saved}>{formatCurrency(goal.savedAmount, currency)}</Text>
      <Text style={styles.target}>of {formatCurrency(goal.targetAmount, currency)}</Text>
      <View style={{ marginTop: Theme.spacing.sm }}>
        <ProgressBar pct={pct} height={6} />
      </View>
      <Text style={styles.pct}>{pct}%</Text>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: { width: 150, marginRight: Theme.spacing.sm },
  emoji: { fontSize: 28, marginBottom: 4 },
  name: { fontSize: Theme.fontSize.sm, fontWeight: '600', color: Colors.textPrimary },
  saved: { fontSize: Theme.fontSize.lg, fontWeight: '700', color: Colors.primary, marginTop: 4 },
  target: { fontSize: Theme.fontSize.xs, color: Colors.textSecondary },
  pct: { fontSize: Theme.fontSize.xs, color: Colors.textSecondary, marginTop: 4, textAlign: 'right' },
});
