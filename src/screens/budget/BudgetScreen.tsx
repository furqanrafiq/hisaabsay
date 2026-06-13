import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';
import { useFinance } from '@/context/FinanceContext';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { BudgetCategoryRow } from '@/components/budget/BudgetCategoryRow';
import { EmptyState } from '@/components/common/EmptyState';
import { DonutChart, DonutSlice } from '@/components/common/DonutChart';
import { AccountSwitcher } from '@/components/common/AccountSwitcher';
import { formatCurrency } from '@/utils/formatCurrency';
import { getBudgetUsage } from '@/utils/calculations';
import { getMonthKey, formatMonthYear } from '@/utils/formatDate';
import { getCategoryById } from '@/constants/categories';
import { addMonths, subMonths } from 'date-fns';

export function BudgetScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const {
    budgets, transactions, deleteBudget,
    currencies, accounts,
    activeCurrency, setActiveCurrency,
    activeAccountId, setActiveAccountId,
  } = useFinance();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const currency = activeCurrency;
  const monthKey = getMonthKey(currentMonth);
  // When an account is active, show budgets scoped to that account.
  // When viewing the aggregate currency, show currency-wide budgets (accountId == '').
  const scopedBudgets = budgets.filter((b) =>
    activeAccountId ? b.accountId === activeAccountId : (b.currency === currency && !b.accountId),
  );
  const usage = getBudgetUsage(transactions, scopedBudgets, monthKey);
  const totalLimit = usage.reduce((s, b) => s + b.limit, 0);
  const totalSpent = usage.reduce((s, b) => s + b.spent, 0);
  const usedPct = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;
  const remaining = totalLimit - totalSpent;

  // Health score dots (1-10)
  const healthScore = totalLimit > 0 ? Math.max(1, Math.round((1 - totalSpent / totalLimit) * 10)) : 10;

  const donutSlices: DonutSlice[] = usage.map((b, i) => {
    const cat = getCategoryById(b.category);
    return { value: b.spent, color: Colors.chart[i % Colors.chart.length], label: cat.name };
  });

  const handleDelete = (id: string, categoryId: string) => {
    const cat = getCategoryById(categoryId);
    Alert.alert('Delete Budget', `Delete budget for "${cat.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteBudget(id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.title}>Budget 📊</Text>
        <AccountSwitcher
          currencies={currencies}
          accounts={accounts}
          activeCurrency={activeCurrency}
          activeAccountId={activeAccountId}
          onSelect={(cur, id) => { setActiveCurrency(cur); setActiveAccountId(id); }}
          onManage={() => navigation.navigate('Accounts')}
        />
      </View>
      <View style={styles.monthRow}>
        <Text style={styles.subtitle}>{formatMonthYear(currentMonth)}</Text>
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={() => setCurrentMonth((m) => subMonths(m, 1))} style={styles.navBtn}>
            <Text style={styles.navArrow}>‹</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setCurrentMonth((m) => addMonths(m, 1))} style={styles.navBtn}>
            <Text style={styles.navArrow}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={usage}
        keyExtractor={(b) => b.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            {/* ── Summary Card ── */}
            {usage.length > 0 && (
              <View style={styles.summaryCard}>
                <View style={styles.summaryLeft}>
                  <DonutChart
                    slices={donutSlices.length > 0 ? donutSlices : [{ value: 1, color: Colors.border, label: '' }]}
                    size={110}
                    thickness={18}
                    centerLabel={`${usedPct}%`}
                    centerSub="used"
                  />
                </View>
                <View style={styles.summaryRight}>
                  <Text style={styles.summaryTitle}>Monthly Budget</Text>
                  <Text style={styles.summaryTotal}>{formatCurrency(totalLimit, currency)}</Text>
                  <Text style={styles.summarySpent}>{formatCurrency(totalSpent, currency)} spent</Text>
                  <Text style={[styles.summaryLeft2, { color: remaining >= 0 ? Colors.income : Colors.expense }]}>
                    {formatCurrency(Math.abs(remaining), currency)} {remaining >= 0 ? 'left 💰' : 'over ⚠️'}
                  </Text>
                </View>
              </View>
            )}

            {/* ── Health Score ── */}
            {usage.length > 0 && (
              <View style={styles.healthRow}>
                <Text style={styles.healthLabel}>💡 Budget Health Score</Text>
                <View style={styles.dots}>
                  {Array.from({ length: 10 }, (_, i) => (
                    <View key={i} style={[styles.dot, i < healthScore ? styles.dotFilled : styles.dotEmpty]} />
                  ))}
                </View>
                <Text style={styles.healthScore}>{healthScore}/10 {healthScore >= 7 ? 'Good' : healthScore >= 4 ? 'Fair' : 'Poor'}</Text>
              </View>
            )}

            <Text style={styles.sectionTitle}>Category Breakdown</Text>
          </>
        }
        ListEmptyComponent={<EmptyState title="No budgets set" subtitle="Tap + to set category budgets" />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.budgetCard} onPress={() => navigation.navigate('BudgetDetail', { budget: item, monthKey })} activeOpacity={0.85}>
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
                  budget: { id: item.id, category: item.category, limit: item.limit, currency: item.currency, accountId: item.accountId },
                })}
              >
                <Text style={styles.actionEdit}>✏️ Edit</Text>
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => handleDelete(item.id, item.category)}
              >
                <Text style={styles.actionDelete}>🗑️ Delete</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
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

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Theme.spacing.lg, paddingTop: Theme.spacing.md, paddingBottom: 0 },
  title: { fontSize: Theme.fontSize.xl, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.3 },
  subtitle: { fontSize: Theme.fontSize.sm, color: Colors.textTertiary },
  monthRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Theme.spacing.lg, paddingBottom: Theme.spacing.sm },
  monthNav: { flexDirection: 'row', gap: 4 },
  navBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center', ...Theme.shadow.card },
  navArrow: { fontSize: 20, color: Colors.primary, fontWeight: '500', lineHeight: 22 },

  // Summary Card
  summaryCard: { flexDirection: 'row', backgroundColor: Colors.card, borderRadius: Theme.radius.lg, padding: Theme.spacing.md, marginBottom: Theme.spacing.md, ...Theme.shadow.card, alignItems: 'center' },
  summaryLeft: { marginRight: Theme.spacing.md },
  summaryRight: { flex: 1 },
  summaryTitle: { fontSize: Theme.fontSize.sm, color: Colors.textSecondary, fontWeight: '500', marginBottom: 4 },
  summaryTotal: { fontSize: Theme.fontSize.xxl, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5, marginBottom: 2 },
  summarySpent: { fontSize: Theme.fontSize.sm, color: Colors.textSecondary, marginBottom: 4 },
  summaryLeft2: { fontSize: Theme.fontSize.sm, fontWeight: '700' },

  // Health Score
  healthRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: Theme.radius.lg, padding: Theme.spacing.md, marginBottom: Theme.spacing.md, gap: 10, ...Theme.shadow.card, flexWrap: 'wrap' },
  healthLabel: { fontSize: Theme.fontSize.sm, fontWeight: '600', color: Colors.textPrimary },
  dots: { flexDirection: 'row', gap: 4 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dotFilled: { backgroundColor: Colors.primary },
  dotEmpty: { backgroundColor: Colors.border },
  healthScore: { fontSize: Theme.fontSize.sm, fontWeight: '700', color: Colors.income },

  sectionTitle: { fontSize: Theme.fontSize.lg, fontWeight: '700', color: Colors.textPrimary, marginBottom: Theme.spacing.sm },

  // Budget Card
  budgetCard: { backgroundColor: Colors.card, borderRadius: Theme.radius.lg, paddingHorizontal: Theme.spacing.md, marginBottom: Theme.spacing.sm, ...Theme.shadow.card },
  actions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: Colors.divider, paddingVertical: Theme.spacing.sm },
  actionBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4 },
  divider: { width: 1, backgroundColor: Colors.divider },
  actionEdit: { fontSize: Theme.fontSize.sm, color: Colors.primary, fontWeight: '600' },
  actionDelete: { fontSize: Theme.fontSize.sm, color: Colors.expense, fontWeight: '600' },

  list: { padding: Theme.spacing.lg, paddingBottom: 100 },

  // FAB
  fab: { position: 'absolute', right: Theme.spacing.lg, bottom: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', ...Theme.shadow.elevated },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300', marginTop: -2 },
});
