import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/context/AuthContext';
import { useFinance } from '@/context/FinanceContext';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { getCategoryById } from '@/constants/categories';
import { formatCurrency } from '@/utils/formatCurrency';
import { getMonthKey } from '@/utils/formatDate';
import { DonutChart } from '@/components/common/DonutChart';
import { getDaysInMonth, getDate } from 'date-fns';

export function BudgetDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();
  const { transactions, accounts } = useFinance();

  const { budget, monthKey } = route.params as { budget: { id: string; category: string; limit: number; spent: number; pct: number; currency: string; accountId: string }; monthKey: string };
  const currency = budget.currency || 'PKR';
  const cat = getCategoryById(budget.category);
  const scopeAccount = budget.accountId ? accounts.find((a) => a.id === budget.accountId) : null;
  const scopeLabel = scopeAccount ? `${scopeAccount.emoji} ${scopeAccount.name}` : `💼 All ${currency}`;

  const now = new Date();
  const totalDays = getDaysInMonth(now);
  const elapsedDays = getDate(now);
  const avgPerDay = elapsedDays > 0 ? Math.round(budget.spent / elapsedDays) : 0;
  const projected = Math.round(avgPerDay * totalDays);
  const budgetPerDay = Math.round(budget.limit / totalDays);
  const remaining = budget.limit - budget.spent;
  const daysLeft = totalDays - elapsedDays;

  const monthTxns = transactions
    .filter(t =>
      t.type === 'expense'
      && t.category === budget.category
      && t.currency === currency
      && t.date.startsWith(monthKey)
      && (!budget.accountId || t.accountId === budget.accountId),
    )
    .sort((a, b) => b.date.localeCompare(a.date));

  const donutSlices = [
    { value: budget.spent, color: Colors.chart[1], label: 'Spent' },
    { value: Math.max(0, budget.limit - budget.spent), color: 'rgba(255,255,255,0.2)', label: 'Remaining' },
  ];

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerEmoji}>{cat.emoji}</Text>
          <Text style={styles.title}>{cat.name}</Text>
        </View>
        <View style={styles.editBadge}>
          <Text style={styles.editBadgeText}>✏️</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Hero Gradient Card ── */}
        <LinearGradient colors={['#1E2B4A', '#3B6FE8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>
          <View style={styles.heroLeft}>
            <Text style={styles.heroSubLabel}>Budget</Text>
            <View style={styles.scopeBadge}><Text style={styles.scopeBadgeText} numberOfLines={1}>{scopeLabel}</Text></View>
            <Text style={styles.heroCategory}>{cat.name}</Text>
            <Text style={styles.heroAmounts}>
              {formatCurrency(budget.spent, currency)} / {formatCurrency(budget.limit, currency)}
            </Text>
            <Text style={[styles.heroRemaining, { color: remaining >= 0 ? '#86EFAC' : '#FCA5A5' }]}>
              {formatCurrency(Math.abs(remaining), currency)} {remaining >= 0 ? 'remaining 💰' : 'over ⚠️'}
            </Text>
            <Text style={styles.heroDays}>{daysLeft} days left</Text>
          </View>
          <View style={styles.heroRight}>
            <DonutChart
              slices={donutSlices}
              size={100}
              thickness={14}
              centerLabel={`${budget.pct}%`}
            />
          </View>
        </LinearGradient>

        {/* ── Stats Row ── */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatCurrency(avgPerDay, currency)}</Text>
            <Text style={styles.statLabel}>Avg/Day</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: projected > budget.limit ? Colors.expense : Colors.textPrimary }]}>
              {formatCurrency(projected, currency)}
            </Text>
            <Text style={styles.statLabel}>Projected</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatCurrency(budgetPerDay, currency)}</Text>
            <Text style={styles.statLabel}>Budget/Day</Text>
          </View>
        </View>

        {/* ── Transactions ── */}
        <Text style={styles.sectionTitle}>Transactions This Month</Text>
        {monthTxns.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No transactions this month</Text>
          </View>
        ) : (
          <View style={styles.txnCard}>
            {monthTxns.map((t, i) => (
              <View key={t.id}>
                {i > 0 && <View style={styles.divider} />}
                <View style={styles.txnRow}>
                  <View style={[styles.txnIcon, { backgroundColor: cat.color + '22' }]}>
                    <Text style={{ fontSize: 18 }}>{cat.emoji}</Text>
                  </View>
                  <View style={styles.txnInfo}>
                    <Text style={styles.txnNote}>{t.note || cat.name}</Text>
                    <Text style={styles.txnDate}>{t.date}</Text>
                  </View>
                  <Text style={styles.txnAmount}>-{formatCurrency(t.amount, currency)}</Text>
                </View>
              </View>
            ))}
            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Spent</Text>
              <Text style={styles.totalAmount}>{formatCurrency(budget.spent, currency)}</Text>
            </View>
          </View>
        )}

        {/* ── Edit Budget ── */}
        <TouchableOpacity
          style={styles.editBtn}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('AddBudget', {
            monthKey,
            budget: { id: budget.id, category: budget.category, limit: budget.limit, currency: budget.currency, accountId: budget.accountId },
          })}
        >
          <Text style={styles.editBtnText}>Edit Budget ✏️</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.lg, paddingTop: Theme.spacing.lg, paddingBottom: Theme.spacing.md,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 22, color: Colors.textPrimary, fontWeight: '500' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerEmoji: { fontSize: 20 },
  title: { fontSize: Theme.fontSize.lg, fontWeight: '800', color: Colors.textPrimary },
  editBadge: { width: 38, height: 38, borderRadius: 10, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center', ...Theme.shadow.card },
  editBadgeText: { fontSize: 16 },

  content: { padding: Theme.spacing.lg, paddingBottom: 40 },

  // Hero
  heroCard: { borderRadius: Theme.radius.xl, padding: Theme.spacing.lg, flexDirection: 'row', alignItems: 'center', marginBottom: Theme.spacing.md, ...Theme.shadow.elevated },
  heroLeft: { flex: 1 },
  heroSubLabel: { fontSize: Theme.fontSize.xs, color: 'rgba(255,255,255,0.65)', fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 },
  scopeBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, marginBottom: 6 },
  scopeBadgeText: { fontSize: Theme.fontSize.xs, fontWeight: '700', color: '#fff' },
  heroCategory: { fontSize: Theme.fontSize.xl, fontWeight: '800', color: '#fff', marginBottom: 4 },
  heroAmounts: { fontSize: Theme.fontSize.sm, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  heroRemaining: { fontSize: Theme.fontSize.sm, fontWeight: '700', marginBottom: 4 },
  heroDays: { fontSize: Theme.fontSize.xs, color: 'rgba(255,255,255,0.55)' },
  heroRight: { marginLeft: Theme.spacing.md },

  // Stats
  statsRow: { flexDirection: 'row', backgroundColor: Colors.card, borderRadius: Theme.radius.lg, padding: Theme.spacing.md, marginBottom: Theme.spacing.lg, ...Theme.shadow.card },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: Theme.fontSize.md, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.3 },
  statLabel: { fontSize: Theme.fontSize.xs, color: Colors.textTertiary, fontWeight: '500', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: Colors.divider, marginVertical: 4 },

  // Transactions
  sectionTitle: { fontSize: Theme.fontSize.lg, fontWeight: '700', color: Colors.textPrimary, marginBottom: Theme.spacing.sm },
  emptyCard: { backgroundColor: Colors.card, borderRadius: Theme.radius.lg, padding: Theme.spacing.xl, alignItems: 'center', marginBottom: Theme.spacing.md },
  emptyText: { fontSize: Theme.fontSize.sm, color: Colors.textTertiary },
  txnCard: { backgroundColor: Colors.card, borderRadius: Theme.radius.lg, marginBottom: Theme.spacing.md, ...Theme.shadow.card, overflow: 'hidden' },
  txnRow: { flexDirection: 'row', alignItems: 'center', padding: Theme.spacing.md },
  txnIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: Theme.spacing.md },
  txnInfo: { flex: 1 },
  txnNote: { fontSize: Theme.fontSize.sm, fontWeight: '600', color: Colors.textPrimary },
  txnDate: { fontSize: Theme.fontSize.xs, color: Colors.textTertiary, marginTop: 2 },
  txnAmount: { fontSize: Theme.fontSize.sm, fontWeight: '700', color: Colors.expense },
  divider: { height: 1, backgroundColor: Colors.divider, marginHorizontal: Theme.spacing.md },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Theme.spacing.md },
  totalLabel: { fontSize: Theme.fontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  totalAmount: { fontSize: Theme.fontSize.md, fontWeight: '800', color: Colors.expense },

  // Edit button
  editBtn: { height: 56, borderRadius: Theme.radius.xl, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', ...Theme.shadow.elevated },
  editBtnText: { color: '#fff', fontSize: Theme.fontSize.md, fontWeight: '700', letterSpacing: 0.3 },
});
