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
import { formatCurrency } from '@/utils/formatCurrency';
import { getMonthlyTotals, calcHealthScore, getHealthLabel } from '@/utils/calculations';
import { getMonthKey, formatMonthYear } from '@/utils/formatDate';

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
      <AppCard color={Colors.cardYellow} style={styles.healthCard}>
        <View style={styles.healthRow}>
          <View>
            <Text style={styles.healthLabel}>Financial Health</Text>
            <Text style={[styles.healthScore, { color: healthColor }]}>{score}/100</Text>
            <Text style={[styles.healthBand, { color: healthColor }]}>{healthLabel}</Text>
          </View>
          <Text style={styles.healthEmoji}>{score >= 86 ? '🌟' : score >= 61 ? '😊' : score >= 31 ? '😐' : '😟'}</Text>
        </View>
      </AppCard>

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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Theme.spacing.lg },
  greeting: { fontSize: Theme.fontSize.xl, fontWeight: '700', color: Colors.textPrimary },
  month: { fontSize: Theme.fontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: Colors.textOnPrimary, fontSize: Theme.fontSize.lg, fontWeight: '700' },
  balanceCard: { marginBottom: Theme.spacing.md, padding: Theme.spacing.lg },
  balanceLabel: { fontSize: Theme.fontSize.sm, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },
  balanceAmount: { fontSize: Theme.fontSize.hero, fontWeight: '800', color: Colors.textOnPrimary, marginVertical: 4 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Theme.spacing.sm },
  balanceItem: { flex: 1 },
  balanceItemLabel: { fontSize: Theme.fontSize.xs, color: 'rgba(255,255,255,0.75)' },
  balanceItemValue: { fontSize: Theme.fontSize.md, fontWeight: '600', marginTop: 2 },
  healthCard: { marginBottom: Theme.spacing.md, padding: Theme.spacing.lg },
  healthRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  healthLabel: { fontSize: Theme.fontSize.sm, fontWeight: '500', color: Colors.textPrimary },
  healthScore: { fontSize: Theme.fontSize.xxl, fontWeight: '800' },
  healthBand: { fontSize: Theme.fontSize.sm, fontWeight: '600', marginTop: 2 },
  healthEmoji: { fontSize: 48 },
  section: { marginBottom: Theme.spacing.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Theme.spacing.sm },
  sectionTitle: { fontSize: Theme.fontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  seeAll: { fontSize: Theme.fontSize.sm, color: Colors.primary, fontWeight: '500' },
  fab: { position: 'absolute', right: Theme.spacing.lg, bottom: 80, width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', ...Theme.shadow.card },
  fabText: { color: Colors.textOnPrimary, fontSize: 28, fontWeight: '300', marginTop: -2 },
});
