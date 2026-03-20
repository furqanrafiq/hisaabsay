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
  const { budgets, transactions, goals, deleteBudget } = useFinance();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const currency = user?.currency ?? 'PKR';
  const monthKey = getMonthKey(currentMonth);
  const usage = getBudgetUsage(transactions, budgets, monthKey);
  const totalLimit = usage.reduce((s, b) => s + b.limit, 0);
  const totalSpent = usage.reduce((s, b) => s + b.spent, 0);
  const goalSavings = goals.reduce((s, g) => s + (g.monthlyContribution ?? 0), 0);

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

      {(usage.length > 0 || goalSavings > 0) && (
        <AppCard style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Budget</Text>
          <Text style={styles.summaryAmount}>
            {formatCurrency(totalSpent, currency)}
            <Text style={styles.summaryOf}> / {formatCurrency(totalLimit, currency)}</Text>
          </Text>
          {goalSavings > 0 && (
            <View style={styles.goalRow}>
              <Text style={styles.goalLabel}>Goal Commitments</Text>
              <Text style={styles.goalAmount}>−{formatCurrency(goalSavings, currency)}</Text>
            </View>
          )}
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
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Theme.spacing.lg, paddingVertical: Theme.spacing.md, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  monthBtn: { padding: Theme.spacing.sm },
  monthArrow: { fontSize: 26, color: Colors.primary },
  monthLabel: { fontSize: Theme.fontSize.lg, fontWeight: '700', color: Colors.textPrimary, letterSpacing: -0.2 },
  summaryCard: { margin: Theme.spacing.md, marginBottom: 0, backgroundColor: Colors.cardAccent },
  summaryLabel: { fontSize: Theme.fontSize.xs, color: Colors.textSecondary, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  summaryAmount: { fontSize: Theme.fontSize.xxl, fontWeight: '800', color: Colors.textPrimary, marginTop: 6, letterSpacing: -0.5 },
  summaryOf: { fontSize: Theme.fontSize.md, fontWeight: '400', color: Colors.textSecondary },
  goalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Theme.spacing.sm, paddingTop: Theme.spacing.sm, borderTopWidth: 1, borderTopColor: Colors.divider },
  goalLabel: { fontSize: Theme.fontSize.xs, fontWeight: '600', color: Colors.textSecondary, letterSpacing: 0.5, textTransform: 'uppercase' },
  goalAmount: { fontSize: Theme.fontSize.md, fontWeight: '700', color: Colors.warning },
  list: { padding: Theme.spacing.md, paddingBottom: 100 },
  budgetCard: { marginBottom: Theme.spacing.sm },
  actions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: Colors.divider, marginTop: Theme.spacing.sm, paddingTop: Theme.spacing.sm },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 4 },
  divider: { width: 1, backgroundColor: Colors.divider },
  actionEdit: { fontSize: Theme.fontSize.sm, color: Colors.primary, fontWeight: '600' },
  actionDelete: { fontSize: Theme.fontSize.sm, color: Colors.expense, fontWeight: '600' },
  fab: { position: 'absolute', right: Theme.spacing.lg, bottom: 24, width: 58, height: 58, borderRadius: 29, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', ...Theme.shadow.elevated },
  fabText: { color: '#FFFFFF', fontSize: 28, fontWeight: '300', marginTop: -2 },
});
