import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';
import { useFinance } from '@/context/FinanceContext';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { ProgressBar } from '@/components/common/ProgressBar';
import { EmptyState } from '@/components/common/EmptyState';
import { formatCurrency } from '@/utils/formatCurrency';
import { Goal } from '@/types';

export function GoalsScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { goals, addToGoal, deleteGoal } = useFinance();
  const currency = user?.currency ?? 'PKR';

  const activeGoals = goals.filter((g) => g.savedAmount < g.targetAmount);
  const completedGoals = goals.filter((g) => g.savedAmount >= g.targetAmount);
  const totalSaved = goals.reduce((s, g) => s + g.savedAmount, 0);

  const handleAddFunds = (goal: Goal) => {
    Alert.prompt(
      'Add Funds',
      `How much to add to "${goal.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Add', onPress: (val) => { const amt = parseFloat(val ?? '0'); if (amt > 0) addToGoal(goal.id, amt); } },
      ],
      'plain-text', '', 'decimal-pad',
    );
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Goal', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteGoal(id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.title}>Goals 🎯</Text>
        <Text style={styles.subtitle}>Track your dreams!</Text>
      </View>

      <FlatList
        data={goals}
        keyExtractor={(g) => g.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          goals.length > 0 ? (
            /* ── Stats Row ── */
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statEmoji}>🎯</Text>
                <Text style={styles.statValue}>{activeGoals.length}</Text>
                <Text style={styles.statLabel}>Active Goals</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statEmoji}>✅</Text>
                <Text style={styles.statValue}>{completedGoals.length}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statEmoji}>💰</Text>
                <Text style={styles.statValue}>{formatCurrency(totalSaved, currency)}</Text>
                <Text style={styles.statLabel}>Total Saved</Text>
              </View>
            </View>
          ) : null
        }
        ListEmptyComponent={<EmptyState title="No goals yet" subtitle="Tap the button below to create your first savings goal" />}
        renderItem={({ item: goal }) => {
          const pct = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.savedAmount / goal.targetAmount) * 100)) : 0;
          const done = pct >= 100;
          return (
            <TouchableOpacity style={styles.goalCard} onPress={() => navigation.navigate('GoalDetail', { goal })} activeOpacity={0.85}>
              {/* Top row */}
              <View style={styles.goalTop}>
                <View style={[styles.goalEmojiWrap, { backgroundColor: done ? '#DCFCE7' : Colors.cardSubtle }]}>
                  <Text style={styles.goalEmoji}>{goal.emoji}</Text>
                </View>
                <View style={styles.goalInfo}>
                  <Text style={styles.goalName}>{goal.name}</Text>
                  {goal.deadline ? (
                    <Text style={styles.goalDue}>Due: {goal.deadline}</Text>
                  ) : null}
                  <View style={styles.goalAmountRow}>
                    <Text style={styles.goalSaved}>{formatCurrency(goal.savedAmount, currency)} saved</Text>
                    <Text style={styles.goalTarget}> of {formatCurrency(goal.targetAmount, currency)}</Text>
                  </View>
                </View>
                <View style={[styles.pctBadge, done && styles.pctBadgeDone]}>
                  <Text style={[styles.pctText, done && { color: Colors.income }]}>{pct}%</Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressWrap}>
                <ProgressBar pct={pct} height={7} color={done ? Colors.income : Colors.primary} />
              </View>

              {/* Actions */}
              {!done && (
                <TouchableOpacity style={styles.addFundsBtn} onPress={(e) => { e.stopPropagation?.(); handleAddFunds(goal); }}>
                  <Text style={styles.addFundsText}>💰 Add Funds</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.deleteBtn} onPress={(e) => { e.stopPropagation?.(); handleDelete(goal.id); }}>
                <Text style={styles.deleteText}>🗑️ Delete</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        }}
        ListFooterComponent={
          <TouchableOpacity style={styles.addGoalBtn} onPress={() => navigation.navigate('AddGoal')} activeOpacity={0.85}>
            <Text style={styles.addGoalText}>+ Add New Goal</Text>
          </TouchableOpacity>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: { paddingHorizontal: Theme.spacing.lg, paddingTop: Theme.spacing.md, paddingBottom: Theme.spacing.sm },
  title: { fontSize: Theme.fontSize.xl, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.3 },
  subtitle: { fontSize: Theme.fontSize.sm, color: Colors.textTertiary, marginTop: 2 },

  // Stats
  statsRow: { flexDirection: 'row', backgroundColor: Colors.card, borderRadius: Theme.radius.lg, padding: Theme.spacing.md, marginBottom: Theme.spacing.md, ...Theme.shadow.card },
  statItem: { flex: 1, alignItems: 'center' },
  statEmoji: { fontSize: 20, marginBottom: 4 },
  statValue: { fontSize: Theme.fontSize.lg, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.3 },
  statLabel: { fontSize: 10, color: Colors.textTertiary, fontWeight: '500', marginTop: 2, textAlign: 'center' },
  statDivider: { width: 1, backgroundColor: Colors.divider, marginVertical: 4 },

  // Goal Card
  goalCard: { backgroundColor: Colors.card, borderRadius: Theme.radius.lg, padding: Theme.spacing.md, marginBottom: Theme.spacing.md, ...Theme.shadow.card },
  goalTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Theme.spacing.sm },
  goalEmojiWrap: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: Theme.spacing.sm },
  goalEmoji: { fontSize: 28 },
  goalInfo: { flex: 1 },
  goalName: { fontSize: Theme.fontSize.md, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2 },
  goalDue: { fontSize: Theme.fontSize.xs, color: Colors.textTertiary, marginBottom: 4 },
  goalAmountRow: { flexDirection: 'row', alignItems: 'baseline' },
  goalSaved: { fontSize: Theme.fontSize.sm, fontWeight: '700', color: Colors.textPrimary },
  goalTarget: { fontSize: Theme.fontSize.sm, color: Colors.textTertiary },
  pctBadge: { backgroundColor: Colors.primaryMuted, paddingHorizontal: 8, paddingVertical: 3, borderRadius: Theme.radius.full },
  pctBadgeDone: { backgroundColor: '#DCFCE7' },
  pctText: { fontSize: Theme.fontSize.xs, fontWeight: '700', color: Colors.primary },

  progressWrap: { marginBottom: Theme.spacing.sm },

  addFundsBtn: { height: 38, borderRadius: Theme.radius.full, backgroundColor: Colors.primaryMuted, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  addFundsText: { color: Colors.primary, fontSize: Theme.fontSize.sm, fontWeight: '700' },
  deleteBtn: { height: 32, borderRadius: Theme.radius.full, alignItems: 'center', justifyContent: 'center' },
  deleteText: { color: Colors.expense, fontSize: Theme.fontSize.sm, fontWeight: '600' },

  // Add Goal button
  addGoalBtn: { height: 54, borderRadius: Theme.radius.xl, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: Theme.spacing.sm, marginBottom: Theme.spacing.xl, ...Theme.shadow.elevated },
  addGoalText: { color: '#fff', fontSize: Theme.fontSize.md, fontWeight: '700', letterSpacing: 0.3 },

  list: { padding: Theme.spacing.lg, paddingBottom: 40 },
});
