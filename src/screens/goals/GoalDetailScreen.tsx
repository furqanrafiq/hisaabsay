import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFinance } from '@/context/FinanceContext';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { Goal } from '@/types';
import { formatCurrency } from '@/utils/formatCurrency';
import { DonutChart } from '@/components/common/DonutChart';

const MILESTONES = [
  { pct: 25, label: '25% saved ✓', emoji: '🎉' },
  { pct: 50, label: 'Halfway there! 🎊', emoji: '🎊' },
  { pct: 75, label: 'Almost done! 🔥', emoji: '🔥' },
  { pct: 100, label: 'Goal achieved! 🏆', emoji: '🏆' },
];

export function GoalDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { editGoal, deleteGoal, addToGoal } = useFinance();
  const goal: Goal = route.params.goal;
  const currency = goal.currency || 'PKR';

  const [depositAmount, setDepositAmount] = useState('');
  const [showDeposit, setShowDeposit] = useState(false);
  const [loading, setLoading] = useState(false);

  const pct = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.savedAmount / goal.targetAmount) * 100)) : 0;
  const needed = Math.max(0, goal.targetAmount - goal.savedAmount);
  const monthsLeft = goal.monthlyContribution && goal.monthlyContribution > 0
    ? Math.ceil(needed / goal.monthlyContribution)
    : null;

  const donutSlices = [
    { value: goal.savedAmount, color: Colors.chart[1], label: 'Saved' },
    { value: Math.max(0, goal.targetAmount - goal.savedAmount), color: Colors.border, label: 'Remaining' },
  ];

  const handleDeposit = async () => {
    const amt = parseFloat(depositAmount);
    if (!depositAmount || isNaN(amt) || amt <= 0) { Alert.alert('Enter a valid amount'); return; }
    setLoading(true);
    await addToGoal(goal.id, amt);
    setLoading(false);
    setDepositAmount('');
    setShowDeposit(false);
    navigation.goBack();
  };

  const handleDelete = () => {
    Alert.alert('Delete Goal', `Delete "${goal.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteGoal(goal.id); navigation.goBack(); } },
    ]);
  };

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Goal Detail</Text>
        <View style={styles.editBadge}>
          <Text style={styles.editBadgeText}>✏️</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Hero Card ── */}
        <LinearGradient colors={['#1E2B4A', '#3B6FE8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>
          <View style={styles.heroLeft}>
            <View style={styles.heroEmojiWrap}>
              <Text style={styles.heroEmoji}>{goal.emoji}</Text>
            </View>
            <Text style={styles.heroName}>{goal.name}</Text>
            {goal.deadline ? <Text style={styles.heroDue}>Due: {goal.deadline}</Text> : null}
            <Text style={styles.heroAmount}>{formatCurrency(goal.savedAmount, currency)}</Text>
            <Text style={styles.heroTarget}>of {formatCurrency(goal.targetAmount, currency)}</Text>
          </View>
          <View style={styles.heroRight}>
            <DonutChart
              slices={donutSlices}
              size={100}
              thickness={14}
              centerLabel={`${pct}%`}
            />
          </View>
        </LinearGradient>

        {/* ── Stats Row ── */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatCurrency(needed, currency)}</Text>
            <Text style={styles.statLabel}>Needed</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{monthsLeft != null ? `${monthsLeft} mo` : '—'}</Text>
            <Text style={styles.statLabel}>Left</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {goal.monthlyContribution ? formatCurrency(goal.monthlyContribution, currency) : '—'}
            </Text>
            <Text style={styles.statLabel}>Monthly</Text>
          </View>
        </View>

        {/* ── Milestones ── */}
        <Text style={styles.sectionTitle}>Milestones 🏆</Text>
        <View style={styles.milestonesCard}>
          {MILESTONES.map((m, i) => {
            const done = pct >= m.pct;
            return (
              <View key={i}>
                {i > 0 && <View style={styles.msDivider} />}
                <View style={styles.msRow}>
                  <View style={[styles.msBubble, done && styles.msBubbleDone]}>
                    {done
                      ? <Text style={styles.msTick}>✓</Text>
                      : <Text style={styles.msPct}>{m.pct}%</Text>}
                  </View>
                  <Text style={[styles.msLabel, done && styles.msLabelDone]}>{m.label}</Text>
                  <Text style={[styles.msStatus, { color: done ? Colors.income : Colors.textTertiary }]}>
                    {done ? 'Done' : 'Pending'}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* ── Add Deposit ── */}
        {showDeposit ? (
          <View style={styles.depositCard}>
            <Text style={styles.depositTitle}>💰 Add Deposit</Text>
            <TextInput
              style={styles.depositInput}
              value={depositAmount}
              onChangeText={setDepositAmount}
              keyboardType="decimal-pad"
              placeholder="Enter amount"
              placeholderTextColor={Colors.textTertiary}
              autoFocus
            />
            <View style={styles.depositActions}>
              <TouchableOpacity style={styles.depositCancel} onPress={() => setShowDeposit(false)}>
                <Text style={styles.depositCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.depositConfirm, loading && { opacity: 0.7 }]} onPress={handleDeposit} disabled={loading}>
                <Text style={styles.depositConfirmText}>{loading ? '…' : 'Add'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.depositBtn} onPress={() => setShowDeposit(true)} activeOpacity={0.85}>
            <Text style={styles.depositBtnText}>💰 Add Deposit</Text>
          </TouchableOpacity>
        )}

        {/* ── Delete Goal ── */}
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.85}>
          <Text style={styles.deleteBtnText}>🗑️ Delete Goal</Text>
        </TouchableOpacity>

        {/* ── Save Changes ── */}
        <TouchableOpacity style={styles.saveBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
          <Text style={styles.saveBtnText}>Save Changes ✓</Text>
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
  title: { fontSize: Theme.fontSize.lg, fontWeight: '800', color: Colors.textPrimary },
  editBadge: { width: 38, height: 38, borderRadius: 10, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center', ...Theme.shadow.card },
  editBadgeText: { fontSize: 16 },

  content: { padding: Theme.spacing.lg, paddingBottom: 40 },

  // Hero
  heroCard: { borderRadius: Theme.radius.xl, padding: Theme.spacing.lg, flexDirection: 'row', alignItems: 'center', marginBottom: Theme.spacing.md, ...Theme.shadow.elevated },
  heroLeft: { flex: 1 },
  heroEmojiWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  heroEmoji: { fontSize: 24 },
  heroName: { fontSize: Theme.fontSize.lg, fontWeight: '800', color: '#fff', marginBottom: 2 },
  heroDue: { fontSize: Theme.fontSize.xs, color: 'rgba(255,255,255,0.65)', marginBottom: 8 },
  heroAmount: { fontSize: Theme.fontSize.xxl, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  heroTarget: { fontSize: Theme.fontSize.sm, color: 'rgba(255,255,255,0.65)' },
  heroRight: { marginLeft: Theme.spacing.md },

  // Stats
  statsRow: { flexDirection: 'row', backgroundColor: Colors.card, borderRadius: Theme.radius.lg, padding: Theme.spacing.md, marginBottom: Theme.spacing.md, ...Theme.shadow.card },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: Theme.fontSize.md, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.3 },
  statLabel: { fontSize: Theme.fontSize.xs, color: Colors.textTertiary, fontWeight: '500', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: Colors.divider, marginVertical: 4 },

  // Milestones
  sectionTitle: { fontSize: Theme.fontSize.lg, fontWeight: '700', color: Colors.textPrimary, marginBottom: Theme.spacing.sm },
  milestonesCard: { backgroundColor: Colors.card, borderRadius: Theme.radius.lg, marginBottom: Theme.spacing.md, ...Theme.shadow.card, overflow: 'hidden' },
  msRow: { flexDirection: 'row', alignItems: 'center', padding: Theme.spacing.md, gap: 12 },
  msBubble: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.cardSubtle, alignItems: 'center', justifyContent: 'center' },
  msBubbleDone: { backgroundColor: Colors.income },
  msTick: { color: '#fff', fontSize: 16, fontWeight: '700' },
  msPct: { fontSize: 10, fontWeight: '700', color: Colors.textTertiary },
  msLabel: { flex: 1, fontSize: Theme.fontSize.sm, color: Colors.textSecondary, fontWeight: '500' },
  msLabelDone: { color: Colors.textPrimary, fontWeight: '600' },
  msStatus: { fontSize: Theme.fontSize.xs, fontWeight: '600' },
  msDivider: { height: 1, backgroundColor: Colors.divider, marginHorizontal: Theme.spacing.md },

  // Deposit
  depositCard: { backgroundColor: Colors.card, borderRadius: Theme.radius.lg, padding: Theme.spacing.md, marginBottom: Theme.spacing.sm, ...Theme.shadow.card },
  depositTitle: { fontSize: Theme.fontSize.sm, fontWeight: '700', color: Colors.textPrimary, marginBottom: Theme.spacing.sm },
  depositInput: { backgroundColor: Colors.cardSubtle, borderRadius: Theme.radius.md, padding: Theme.spacing.md, fontSize: Theme.fontSize.md, color: Colors.textPrimary, marginBottom: Theme.spacing.sm },
  depositActions: { flexDirection: 'row', gap: 10 },
  depositCancel: { flex: 1, height: 42, borderRadius: Theme.radius.full, backgroundColor: Colors.cardSubtle, alignItems: 'center', justifyContent: 'center' },
  depositCancelText: { fontSize: Theme.fontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  depositConfirm: { flex: 1, height: 42, borderRadius: Theme.radius.full, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  depositConfirmText: { fontSize: Theme.fontSize.sm, fontWeight: '700', color: '#fff' },
  depositBtn: { height: 52, borderRadius: Theme.radius.lg, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center', marginBottom: Theme.spacing.sm, ...Theme.shadow.card },
  depositBtnText: { fontSize: Theme.fontSize.md, fontWeight: '700', color: Colors.textPrimary },

  deleteBtn: { height: 52, borderRadius: Theme.radius.lg, backgroundColor: Colors.expense + '15', alignItems: 'center', justifyContent: 'center', marginBottom: Theme.spacing.md },
  deleteBtnText: { fontSize: Theme.fontSize.md, fontWeight: '700', color: Colors.expense },

  saveBtn: { height: 56, borderRadius: Theme.radius.xl, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', ...Theme.shadow.elevated },
  saveBtnText: { color: '#fff', fontSize: Theme.fontSize.md, fontWeight: '700', letterSpacing: 0.3 },
});
