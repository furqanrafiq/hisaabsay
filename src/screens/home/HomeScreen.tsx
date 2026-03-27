import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';
import { useFinance } from '@/context/FinanceContext';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { TransactionItem } from '@/components/transactions/TransactionItem';
import { EmptyState } from '@/components/common/EmptyState';
import { DonutChart, DonutSlice } from '@/components/common/DonutChart';
import { ProgressBar } from '@/components/common/ProgressBar';
import { formatCurrency } from '@/utils/formatCurrency';
import { getMonthlyTotals } from '@/utils/calculations';
import { getMonthKey, formatMonthYear } from '@/utils/formatDate';
import { CATEGORIES, getCategoryById } from '@/constants/categories';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function HomeScreen() {
  const { user } = useAuth();
  const { transactions, goals, customCategories } = useFinance();
  const navigation = useNavigation<any>();

  const now = new Date();
  const monthKey = getMonthKey(now);
  const currency = user?.currency ?? 'PKR';
  const { income, expense, balance } = getMonthlyTotals(transactions, monthKey);
  const recent = transactions.slice(0, 5);
  const name = user?.name?.split(' ')[0] || 'there';

  const monthlyExpenses = transactions.filter((t) => t.type === 'expense' && t.date.startsWith(monthKey));
  const categoryTotals: Record<string, number> = {};
  monthlyExpenses.forEach((t) => {
    categoryTotals[t.category] = (categoryTotals[t.category] ?? 0) + t.amount;
  });
  const allCategories = [...CATEGORIES, ...customCategories];
  const chartSlices: DonutSlice[] = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, value], i) => {
      const cat = allCategories.find((c) => c.id === id) ?? getCategoryById('other');
      return { value, color: Colors.chart[i % Colors.chart.length], label: cat.name, emoji: cat.emoji };
    });
  const totalExp = chartSlices.reduce((s, sl) => s + sl.value, 0);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}, {name} 👋</Text>
            <Text style={styles.month}>{formatMonthYear(now)}</Text>
          </View>
        </View>

        {/* ── Balance Card ── */}
        <LinearGradient
          colors={['#1E2B4A', '#263764']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          <View style={styles.balanceTop}>
            <Text style={styles.balanceLabel}>Total Balance 💼</Text>
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>+ Active</Text>
            </View>
          </View>
          <Text style={styles.balanceAmount}>{formatCurrency(balance, currency)}</Text>
          <Text style={styles.balanceSub}>
            {balance >= 0 ? '↑' : '↓'} {formatCurrency(Math.abs(income - expense), currency)} this month
          </Text>
        </LinearGradient>

        {/* ── This Month ── */}
        <Text style={styles.sectionTitle}>This Month</Text>
        <View style={styles.thisMonthRow}>
          <View style={[styles.thisMonthCard, { marginRight: 8 }]}>
            <Text style={styles.thisMonthIcon}>💰</Text>
            <Text style={styles.thisMonthLabel}>Income</Text>
            <Text style={[styles.thisMonthAmount, { color: Colors.income }]}>{formatCurrency(income, currency)}</Text>
          </View>
          <View style={[styles.thisMonthCard, { marginLeft: 8 }]}>
            <Text style={styles.thisMonthIcon}>💸</Text>
            <Text style={styles.thisMonthLabel}>Expenses</Text>
            <Text style={[styles.thisMonthAmount, { color: Colors.expense }]}>{formatCurrency(expense, currency)}</Text>
          </View>
        </View>

        {/* ── Spending Breakdown ── */}
        {chartSlices.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Spending Breakdown 📊</Text>
            <View style={styles.card}>
              <View style={styles.chartRow}>
                <DonutChart
                  slices={chartSlices}
                  size={150}
                  thickness={26}
                  centerLabel={formatCurrency(expense, currency)}
                  centerSub="spent"
                />
                <View style={styles.legend}>
                  {chartSlices.map((sl, i) => {
                    const pct = totalExp > 0 ? Math.round((sl.value / totalExp) * 100) : 0;
                    return (
                      <View key={i} style={styles.legendItem}>
                        <Text style={styles.legendEmoji}>{(sl as any).emoji}</Text>
                        <Text style={styles.legendLabel} numberOfLines={1}>{sl.label}</Text>
                        <Text style={styles.legendPct}>{pct}%</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ── Goals ── */}
        {goals.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Goals 🎯</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Goals')}>
                <Text style={styles.seeAll}>See all →</Text>
              </TouchableOpacity>
            </View>
            {goals.slice(0, 2).map((g) => {
              const pct = g.targetAmount > 0 ? Math.round((g.savedAmount / g.targetAmount) * 100) : 0;
              return (
                <View key={g.id} style={[styles.card, styles.goalRow]}>
                  <View style={styles.goalLeft}>
                    <Text style={styles.goalEmoji}>{g.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.goalName}>{g.name}</Text>
                      <Text style={styles.goalAmounts}>
                        {formatCurrency(g.savedAmount, currency)} / {formatCurrency(g.targetAmount, currency)}
                      </Text>
                      <ProgressBar pct={pct} height={6} color={Colors.primary} />
                    </View>
                  </View>
                  <View style={styles.goalPctWrap}>
                    <Text style={styles.goalPct}>{pct}%</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ── Recent Transactions ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Transact')}>
              <Text style={styles.seeAll}>View all →</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.card}>
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
          </View>
        </View>

      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddTransaction')} activeOpacity={0.85}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Theme.spacing.lg, paddingBottom: 100 },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Theme.spacing.lg },
  greeting: { fontSize: Theme.fontSize.xl, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.3 },
  month: { fontSize: Theme.fontSize.sm, color: Colors.textTertiary, marginTop: 2 },
  bellWrap: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center', ...Theme.shadow.card },
  bell: { fontSize: 20 },

  // Balance card
  balanceCard: { borderRadius: Theme.radius.xl, padding: Theme.spacing.lg, marginBottom: Theme.spacing.lg, ...Theme.shadow.elevated },
  balanceTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  balanceLabel: { fontSize: Theme.fontSize.sm, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  activeBadge: { backgroundColor: '#22C55E', paddingHorizontal: 10, paddingVertical: 4, borderRadius: Theme.radius.full },
  activeBadgeText: { fontSize: Theme.fontSize.xs, color: '#fff', fontWeight: '700' },
  balanceAmount: { fontSize: Theme.fontSize.hero, fontWeight: '800', color: '#fff', letterSpacing: -1, marginBottom: 8 },
  balanceSub: { fontSize: Theme.fontSize.sm, color: 'rgba(255,255,255,0.65)' },

  // This Month
  thisMonthRow: { flexDirection: 'row', marginBottom: Theme.spacing.lg },
  thisMonthCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Theme.radius.lg,
    padding: Theme.spacing.md,
    ...Theme.shadow.card,
  },
  thisMonthIcon: { fontSize: 22, marginBottom: 6 },
  thisMonthLabel: { fontSize: Theme.fontSize.sm, color: Colors.textSecondary, fontWeight: '500', marginBottom: 4 },
  thisMonthAmount: { fontSize: Theme.fontSize.lg, fontWeight: '800', letterSpacing: -0.3 },

  // Section
  section: { marginBottom: Theme.spacing.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Theme.spacing.sm },
  sectionTitle: { fontSize: Theme.fontSize.lg, fontWeight: '700', color: Colors.textPrimary, letterSpacing: -0.2, marginBottom: Theme.spacing.sm },
  seeAll: { fontSize: Theme.fontSize.sm, color: Colors.primaryLight, fontWeight: '600' },
  card: { backgroundColor: Colors.card, borderRadius: Theme.radius.lg, padding: Theme.spacing.md, ...Theme.shadow.card },

  // Chart
  chartRow: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.md },
  legend: { flex: 1, gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendEmoji: { fontSize: 14 },
  legendLabel: { flex: 1, fontSize: Theme.fontSize.xs, color: Colors.textSecondary, fontWeight: '500' },
  legendPct: { fontSize: Theme.fontSize.xs, color: Colors.textPrimary, fontWeight: '700' },

  // Goals
  goalRow: { marginBottom: 8, padding: Theme.spacing.md },
  goalLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  goalEmoji: { fontSize: 28 },
  goalName: { fontSize: Theme.fontSize.md, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2 },
  goalAmounts: { fontSize: Theme.fontSize.xs, color: Colors.textTertiary, marginBottom: 6 },
  goalPctWrap: { marginLeft: 8 },
  goalPct: { fontSize: Theme.fontSize.sm, fontWeight: '700', color: Colors.primaryLight },

  // FAB
  fab: { position: 'absolute', right: Theme.spacing.lg, bottom: 90, width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', ...Theme.shadow.elevated },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300', marginTop: -2 },
});
