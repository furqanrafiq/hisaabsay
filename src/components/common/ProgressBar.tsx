import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';

interface Props {
  pct: number;
  height?: number;
  color?: string;
}

function getColor(pct: number) {
  if (pct >= 100) return Colors.expense;
  if (pct >= 80) return Colors.warning;
  return Colors.income;
}

export function ProgressBar({ pct, height = 8, color }: Props) {
  const clamped = Math.min(100, Math.max(0, pct));
  return (
    <View style={[styles.track, { height }]}>
      <View style={[styles.fill, { width: `${clamped}%`, backgroundColor: color ?? getColor(pct), height }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { backgroundColor: Colors.border, borderRadius: Theme.radius.full, overflow: 'hidden' },
  fill: { borderRadius: Theme.radius.full },
});
