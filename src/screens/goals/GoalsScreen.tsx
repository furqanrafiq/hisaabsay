import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';
import { useFinance } from '@/context/FinanceContext';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { AppCard } from '@/components/common/AppCard';
import { ProgressBar } from '@/components/common/ProgressBar';
import { EmptyState } from '@/components/common/EmptyState';
import { formatCurrency } from '@/utils/formatCurrency';
import { Goal } from '@/types';

export function GoalsScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { goals, addToGoal, deleteGoal } = useFinance();
  const currency = user?.currency ?? 'PKR';

  const handleAddFunds = (goal: Goal) => {
    Alert.prompt('Add Funds', `How much to add to "${goal.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Add', onPress: (val) => { const amt = parseFloat(val ?? '0'); if (amt > 0) addToGoal(goal.id, amt); } },
    ], 'plain-text', '', 'decimal-pad');
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Goal', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteGoal(id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <FlatList
        data={goals}
        keyExtractor={(g) => g.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState title="No goals yet" subtitle="Tap + to create your first savings goal" />}
        renderItem={({ item: goal }) => {
          const pct = goal.targetAmount > 0 ? Math.round((goal.savedAmount / goal.targetAmount) * 100) : 0;
          return (
            <AppCard style={styles.goalCard}>
              <View style={styles.goalHeader}>
                <Text style={styles.goalEmoji}>{goal.emoji}</Text>
                <View style={styles.goalInfo}>
                  <Text style={styles.goalName}>{goal.name}</Text>
                  <Text style={styles.goalTarget}>Target: {formatCurrency(goal.targetAmount, currency)}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(goal.id)} style={styles.deleteBtn}>
                  <Text style={styles.deleteText}>✕</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.progressRow}>
                <Text style={styles.saved}>{formatCurrency(goal.savedAmount, currency)}</Text>
                <Text style={styles.pct}>{pct}%</Text>
              </View>
              <ProgressBar pct={pct} height={10} />
              <TouchableOpacity style={styles.addFundsBtn} onPress={() => handleAddFunds(goal)}>
                <Text style={styles.addFundsText}>+ Add Funds</Text>
              </TouchableOpacity>
            </AppCard>
          );
        }}
      />
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddGoal')} activeOpacity={0.85}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  list: { padding: Theme.spacing.md, paddingBottom: 100 },
  goalCard: { marginBottom: Theme.spacing.md, padding: Theme.spacing.lg },
  goalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Theme.spacing.md },
  goalEmoji: { fontSize: 32, marginRight: Theme.spacing.sm },
  goalInfo: { flex: 1 },
  goalName: { fontSize: Theme.fontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  goalTarget: { fontSize: Theme.fontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  deleteBtn: { padding: 4 },
  deleteText: { color: Colors.textSecondary, fontSize: Theme.fontSize.md },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Theme.spacing.sm },
  saved: { fontSize: Theme.fontSize.lg, fontWeight: '600', color: Colors.primary },
  pct: { fontSize: Theme.fontSize.md, fontWeight: '600', color: Colors.textSecondary },
  addFundsBtn: { marginTop: Theme.spacing.md, height: 40, borderRadius: Theme.radius.full, backgroundColor: Colors.cardMint, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.primary },
  addFundsText: { color: Colors.primary, fontSize: Theme.fontSize.sm, fontWeight: '600' },
  fab: { position: 'absolute', right: Theme.spacing.lg, bottom: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', ...Theme.shadow.card },
  fabText: { color: Colors.textOnPrimary, fontSize: 28, fontWeight: '300', marginTop: -2 },
});
