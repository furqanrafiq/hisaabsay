import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';
import { useFinance } from '@/context/FinanceContext';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { AppCard } from '@/components/common/AppCard';
import { TransactionItem } from '@/components/transactions/TransactionItem';
import { GoalCard } from '@/components/goals/GoalCard';
import { EmptyState } from '@/components/common/EmptyState';
import { DonutChart, DonutSlice } from '@/components/common/DonutChart';
import { formatCurrency } from '@/utils/formatCurrency';
import { getMonthlyTotals, calcHealthScore, getHealthLabel } from '@/utils/calculations';
import { getMonthKey, formatMonthYear } from '@/utils/formatDate';
import { CATEGORIES, getCategoryById } from '@/constants/categories';

export function HomeScreen() {
  const { user } = useAuth();
  const { transactions, goals, customCategories } = useFinance();
  const navigation = useNavigation<any>();

  const now = new Date();
  const monthKey = getMonthKey(now);
  const currency = user?.currency ?? 'PKR';
  const { income, expense, balance } = getMonthlyTotals(transactions, monthKey);
  const score = calcHealthScore(income, expense);
  const { label: healthLabel, color: healthColor } = getHealthLabel(score);
  const recent = transactions.slice(0, 5);
  const name = user?.name || 'there';

  // Build donut chart slices from expense categories this month
  const monthlyExpenses = transactions.filter((t) => t.type === 'expense' && t.date.startsWith(monthKey));
  const categoryTotals: Record<string, number> = {};
  monthlyExpenses.forEach((t) => {
    categoryTotals[t.category] = (categoryTotals[t.category] ?? 0) + t.amount;
  });
  const allCategories = [...CATEGORIES, ...customCategories];
  const chartSlices: DonutSlice[] = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([id, value]) => {
      const cat = allCategories.find((c) => c.id === id) ?? getCategoryById('other');
      return { value, color: cat.color, label: cat.name };
    });

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hi, {name} 👋</Text>
          <Text style={styles.month}>{formatMonthYear(now)}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.avatar}>
          <Text style={styles.avatarText}>{name[0]?.toUpperCase() || 'U'}</Text>
        </TouchableOpacity>
      </View>

      {/* Balance Card */}
      <AppCard color={Colors.primary} style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Net Balance</Text>
        <Text style={styles.balanceAmount}>{formatCurrency(balance, currency)}</Text>
        <View style={styles.balanceRow}>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceItemLabel}>↑ Income</Text>
            <Text style={[styles.balanceItemValue, { color: '#A8E6B5' }]}>{formatCurrency(income, currency)}</Text>
          </View>
          <View style={[styles.balanceItem, { alignItems: 'flex-end' }]}>
            <Text style={styles.balanceItemLabel}>↓ Expense</Text>
            <Text style={[styles.balanceItemValue, { color: '#FFB3B0' }]}>{formatCurrency(expense, currency)}</Text>
          </View>
        </View>
      </AppCard>

      {/* Health Score */}
      <AppCard color={Colors.cardAccent} style={styles.healthCard}>
        <View style={styles.healthRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.healthLabel}>Financial Health</Text>
            <Text style={[styles.healthScore, { color: healthColor }]}>{score}/100</Text>
            <Text style={[styles.healthBand, { color: healthColor }]}>{healthLabel}</Text>
          </View>
          <Text style={styles.healthEmoji}>{score >= 86 ? '🌟' : score >= 61 ? '😊' : score >= 31 ? '😐' : '😟'}</Text>
        </View>
      </AppCard>

      {/* Category Breakdown */}
      {chartSlices.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Spending Breakdown</Text>
            <Text style={styles.sectionSub}>{formatMonthYear(now)}</Text>
          </View>
          <AppCard style={styles.chartCard}>
            <View style={styles.chartRow}>
              <DonutChart
                slices={chartSlices}
                size={160}
                thickness={28}
                centerLabel={formatCurrency(expense, currency)}
                centerSub="spent"
              />
              <View style={styles.legend}>
                {chartSlices.map((sl, i) => (
                  <View key={i} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: sl.color }]} />
                    <Text style={styles.legendLabel} numberOfLines={1}>{sl.label}</Text>
                    <Text style={styles.legendValue}>{formatCurrency(sl.value, currency)}</Text>
                  </View>
                ))}
              </View>
            </View>
          </AppCard>
        </View>
      )}

      {/* Goals */}
      {goals.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Savings Goals</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Goals')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {goals.map((g) => <GoalCard key={g.id} goal={g} currency={currency} />)}
          </ScrollView>
        </View>
      )}

      {/* Recent Transactions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        <AppCard>
          {recent.length === 0 ? (
            <EmptyState title="No transactions yet" subtitle="Tap + to add your first one" />
          ) : (
            recent.map((t) => (
              <TransactionItem
                key={t.id}
                item={t}
                currency={currency}
                extraCategories={customCategories}
                onPress={() => navigation.navigate('EditTransaction', { transaction: t })}
              />
            ))
          )}
        </AppCard>
      </View>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddTransaction')} activeOpacity={0.85}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Theme.spacing.lg, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Theme.spacing.md },
  greeting: { fontSize: Theme.fontSize.xl, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.3 },
  month: { fontSize: Theme.fontSize.sm, color: Colors.textTertiary, marginTop: 2, letterSpacing: 0.2 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', ...Theme.shadow.card },
  avatarText: { color: Colors.textOnPrimary, fontSize: Theme.fontSize.lg, fontWeight: '700' },
  balanceCard: { marginBottom: Theme.spacing.lg, padding: Theme.spacing.lg, borderRadius: Theme.radius.xxl, ...Theme.shadow.elevated },
  balanceLabel: { fontSize: Theme.fontSize.xs, color: 'rgba(255,255,255,0.65)', fontWeight: '500', letterSpacing: 1.2, textTransform: 'uppercase' },
  balanceAmount: { fontSize: Theme.fontSize.hero, fontWeight: '800', color: Colors.textOnPrimary, marginVertical: 8, letterSpacing: -1 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Theme.spacing.md, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)', paddingTop: Theme.spacing.md },
  balanceItem: { flex: 1 },
  balanceItemLabel: { fontSize: Theme.fontSize.xs, color: 'rgba(255,255,255,0.65)', letterSpacing: 0.8 },
  balanceItemValue: { fontSize: Theme.fontSize.md, fontWeight: '700', marginTop: 4 },
  healthCard: { marginBottom: Theme.spacing.md, padding: Theme.spacing.lg, borderLeftWidth: 3, borderLeftColor: Colors.primaryLight },
  healthRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  healthLabel: { fontSize: Theme.fontSize.xs, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 0.8, textTransform: 'uppercase' },
  healthScore: { fontSize: Theme.fontSize.xxl, fontWeight: '800', marginTop: 4 },
  healthBand: { fontSize: Theme.fontSize.sm, fontWeight: '600', marginTop: 2 },
  healthEmoji: { fontSize: 40 },
  section: { marginBottom: Theme.spacing.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Theme.spacing.sm },
  sectionTitle: { fontSize: Theme.fontSize.lg, fontWeight: '700', color: Colors.textPrimary, letterSpacing: -0.2 },
  seeAll: { fontSize: Theme.fontSize.sm, color: Colors.primaryLight, fontWeight: '600' },
  fab: { position: 'absolute', right: Theme.spacing.lg, bottom: 80, width: 58, height: 58, borderRadius: 29, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', ...Theme.shadow.elevated },
  fabText: { color: Colors.textOnPrimary, fontSize: 30, fontWeight: '300', marginTop: -2 },
  sectionSub: { fontSize: Theme.fontSize.xs, color: Colors.textTertiary, fontWeight: '500' },
  chartCard: { padding: Theme.spacing.md },
  chartRow: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.md },
  legend: { flex: 1, gap: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { flex: 1, fontSize: Theme.fontSize.xs, color: Colors.textSecondary, fontWeight: '500' },
  legendValue: { fontSize: Theme.fontSize.xs, color: Colors.textPrimary, fontWeight: '700' },
});
