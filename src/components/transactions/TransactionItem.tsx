import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Transaction } from '@/types';
import { CATEGORIES, getCategoryById, Category } from '@/constants/categories';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatShortDate } from '@/utils/formatDate';

interface Props {
  item: Transaction;
  currency: string;
  onPress?: () => void;
  extraCategories?: Category[];
}

export function TransactionItem({ item, currency, onPress, extraCategories = [] }: Props) {
  const allCats = [...CATEGORIES, ...extraCategories];
  const cat = allCats.find((c) => c.id === item.category) ?? getCategoryById('other');
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.iconWrap, { backgroundColor: cat.color + '22' }]}>
        <Text style={styles.emoji}>{cat.emoji}</Text>
      </View>
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.catName}>{cat.name}</Text>
          {item.fixed && <View style={styles.fixedBadge}><Text style={styles.fixedBadgeText}>Fixed</Text></View>}
        </View>
        <Text style={styles.note} numberOfLines={1}>
          {item.note ? `${item.note} · ` : ''}{formatShortDate(item.date)}
        </Text>
      </View>
      <Text style={[styles.amount, { color: item.type === 'income' ? Colors.income : Colors.expense }]}>
        {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount, currency)}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.md,
  },
  emoji: { fontSize: 22 },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  catName: { fontSize: Theme.fontSize.md, fontWeight: '600', color: Colors.textPrimary },
  fixedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Theme.radius.full,
    backgroundColor: Colors.primaryMuted,
  },
  fixedBadgeText: { fontSize: 9, fontWeight: '700', color: Colors.primary, letterSpacing: 0.5, textTransform: 'uppercase' },
  note: { fontSize: Theme.fontSize.xs, color: Colors.textTertiary, marginTop: 3 },
  amount: { fontSize: Theme.fontSize.md, fontWeight: '700', letterSpacing: -0.3 },
});
