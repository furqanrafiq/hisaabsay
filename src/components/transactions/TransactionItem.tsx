import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
        <MaterialCommunityIcons name={cat.icon as any} size={22} color={cat.color} />
      </View>
      <View style={styles.info}>
        <Text style={styles.catName}>{cat.name}</Text>
        <Text style={styles.note} numberOfLines={1}>{item.note || formatShortDate(item.date)}</Text>
      </View>
      <Text style={[styles.amount, { color: item.type === 'income' ? Colors.income : Colors.expense }]}>
        {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount, currency)}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: Theme.spacing.sm },
  iconWrap: { width: 44, height: 44, borderRadius: Theme.radius.md, alignItems: 'center', justifyContent: 'center', marginRight: Theme.spacing.sm },
  info: { flex: 1 },
  catName: { fontSize: Theme.fontSize.md, fontWeight: '500', color: Colors.textPrimary },
  note: { fontSize: Theme.fontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  amount: { fontSize: Theme.fontSize.md, fontWeight: '600' },
});
