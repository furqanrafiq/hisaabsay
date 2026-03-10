import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';
import { useFinance } from '@/context/FinanceContext';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { AppCard } from '@/components/common/AppCard';
import { BudgetCategoryRow } from '@/components/budget/BudgetCategoryRow';
import { EmptyState } from '@/components/common/EmptyState';
import { formatCurrency } from '@/utils/formatCurrency';
import { getBudgetUsage } from '@/utils/calculations';
import { getMonthKey, formatMonthYear } from '@/utils/formatDate';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getCategoryById } from '@/constants/categories';
import { addMonths, subMonths } from 'date-fns';

export function BudgetScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { budgets, transactions, deleteBudget } = useFinance();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const currency = user?.currency ?? 'PKR';
  const monthKey = getMonthKey(currentMonth);
  const usage = getBudgetUsage(transactions, budgets, monthKey);
  const totalLimit = usage.reduce((s, b) => s + b.limit, 0);
  const totalSpent = usage.reduce((s, b) => s + b.spent, 0);

  const handleDelete = (id: string, categoryId: string) => {
    const cat = getCategoryById(categoryId);
    Alert.alert('Delete Budget', `Delete budget for "${cat.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteBudget(id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.monthRow}>
        <TouchableOpacity onPress={() => setCurrentMonth((m) => subMonths(m, 1))} style={styles.monthBtn}>
          <Text style={styles.monthArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{formatMonthYear(currentMonth)}</Text>
        <TouchableOpacity onPress={() => setCurrentMonth((m) => addMonths(m, 1))} style={styles.monthBtn}>
          <Text style={styles.monthArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {usage.length > 0 && (
        <AppCard style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Budget</Text>
          <Text style={styles.summaryAmount}>
            {formatCurrency(totalSpent, currency)}
            <Text style={styles.summaryOf}> / {formatCurrency(totalLimit, currency)}</Text>
          </Text>
        </AppCard>
      )}

      <FlatList
        data={usage}
        keyExtractor={(b) => b.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState title="No budgets set" subtitle="Tap + to set category budgets" />}
        renderItem={({ item }) => (
          <AppCard style={styles.budgetCard}>
            <BudgetCategoryRow
              categoryId={item.category}
              limit={item.limit}
              spent={item.spent}
              pct={item.pct}
              currency={currency}
            />
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => navigation.navigate('AddBudget', {
                  monthKey,
                  budget: { id: item.id, category: item.category, limit: item.limit },
                })}
              >
                <MaterialCommunityIcons name="pencil-outline" size={16} color={Colors.primary} />
                <Text style={styles.actionEdit}>Edit</Text>
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => handleDelete(item.id, item.category)}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={16} color={Colors.expense} />
                <Text style={styles.actionDelete}>Delete</Text>
              </TouchableOpacity>
            </View>
          </AppCard>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddBudget', { monthKey })} activeOpacity={0.85}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Theme.spacing.lg, paddingVertical: Theme.spacing.sm, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  monthBtn: { padding: Theme.spacing.sm },
  monthArrow: { fontSize: 24, color: Colors.primary, fontWeight: '500' },
  monthLabel: { fontSize: Theme.fontSize.md, fontWeight: '600', color: Colors.textPrimary },
  summaryCard: { margin: Theme.spacing.md, marginBottom: 0 },
  summaryLabel: { fontSize: Theme.fontSize.sm, color: Colors.textSecondary },
  summaryAmount: { fontSize: Theme.fontSize.xl, fontWeight: '700', color: Colors.textPrimary, marginTop: 4 },
  summaryOf: { fontSize: Theme.fontSize.md, fontWeight: '400', color: Colors.textSecondary },
  list: { padding: Theme.spacing.md, paddingBottom: 100 },
  budgetCard: { marginBottom: Theme.spacing.sm },
  actions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: Colors.border, marginTop: Theme.spacing.sm, paddingTop: Theme.spacing.sm },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 4 },
  divider: { width: 1, backgroundColor: Colors.border },
  actionEdit: { fontSize: Theme.fontSize.sm, color: Colors.primary, fontWeight: '500' },
  actionDelete: { fontSize: Theme.fontSize.sm, color: Colors.expense, fontWeight: '500' },
  fab: { position: 'absolute', right: Theme.spacing.lg, bottom: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', elevation: 3 },
  fabText: { color: '#FFFFFF', fontSize: 28, fontWeight: '300', marginTop: -2 },
});
