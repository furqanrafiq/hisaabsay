import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getCategoryById } from '@/constants/categories';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { formatCurrency } from '@/utils/formatCurrency';
import { ProgressBar } from '@/components/common/ProgressBar';

interface Props {
  categoryId: string;
  limit: number;
  spent: number;
  pct: number;
  currency: string;
}

export function BudgetCategoryRow({ categoryId, limit, spent, pct, currency }: Props) {
  const cat = getCategoryById(categoryId);
  const isOver = pct >= 100;
  const barColor = isOver ? Colors.expense : pct >= 80 ? Colors.warning : Colors.primaryLight;
  return (
    <View style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: cat.color + '22' }]}>
        <Text style={styles.emoji}>{cat.emoji}</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.name}>{cat.name}</Text>
          <Text style={[styles.pctText, { color: isOver ? Colors.expense : Colors.textSecondary }]}>
            {pct}%
          </Text>
        </View>
        <View style={styles.amountsRow}>
          <Text style={styles.spent}>{formatCurrency(spent, currency)}</Text>
          <Text style={styles.limit}> / {formatCurrency(limit, currency)}</Text>
        </View>
        <ProgressBar pct={pct} height={6} color={barColor} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.md,
  },
  emoji: { fontSize: 22 },
  content: { flex: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  name: { fontSize: Theme.fontSize.md, fontWeight: '600', color: Colors.textPrimary },
  pctText: { fontSize: Theme.fontSize.sm, fontWeight: '700' },
  amountsRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 8 },
  spent: { fontSize: Theme.fontSize.sm, fontWeight: '600', color: Colors.textPrimary },
  limit: { fontSize: Theme.fontSize.sm, color: Colors.textTertiary },
});
