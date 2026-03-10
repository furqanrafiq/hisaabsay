import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
  return (
    <View style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: cat.color + '22' }]}>
        <MaterialCommunityIcons name={cat.icon as any} size={20} color={cat.color} />
      </View>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.name}>{cat.name}</Text>
          <Text style={styles.amounts}>
            <Text style={{ color: Colors.textPrimary }}>{formatCurrency(spent, currency)}</Text>
            <Text style={styles.limit}> / {formatCurrency(limit, currency)}</Text>
          </Text>
        </View>
        <ProgressBar pct={pct} height={6} />
        <Text style={styles.pctText}>{pct}% used</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: Theme.spacing.sm },
  iconWrap: { width: 40, height: 40, borderRadius: Theme.radius.md, alignItems: 'center', justifyContent: 'center', marginRight: Theme.spacing.sm, marginTop: 2 },
  content: { flex: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  name: { fontSize: Theme.fontSize.md, fontWeight: '500', color: Colors.textPrimary },
  amounts: { fontSize: Theme.fontSize.sm },
  limit: { color: Colors.textSecondary },
  pctText: { fontSize: Theme.fontSize.xs, color: Colors.textSecondary, marginTop: 4 },
});
