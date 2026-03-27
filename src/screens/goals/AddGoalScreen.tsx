import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, KeyboardAvoidingView, Platform, TextInput, Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useFinance } from '@/context/FinanceContext';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';

const GOAL_ICONS = ['🛡️', '💻', '✈️', '🏠', '📱', '🎓', '🚗', '💍', '🌴', '🎯'];
const GOAL_COLORS = ['#1E293B', '#8B5CF6', '#3B82F6', '#22C55E', '#475569', '#EF4444'];
const PRIORITIES = ['Low', 'Medium', 'High'];

export function AddGoalScreen() {
  const navigation = useNavigation<any>();
  const { addGoal } = useFinance();

  const [emoji, setEmoji] = useState('🎯');
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [currentSavings, setCurrentSavings] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState('High');
  const [goalColor, setGoalColor] = useState('#1E293B');
  const [autoContribute, setAutoContribute] = useState(false);
  const [monthly, setMonthly] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) { Alert.alert('Enter a goal name'); return; }
    const amt = parseFloat(target);
    if (!target || isNaN(amt) || amt <= 0) { Alert.alert('Enter a valid target amount'); return; }
    const savedAmt = parseFloat(currentSavings) || 0;
    const monthlyAmt = autoContribute ? (parseFloat(monthly) || 0) : 0;
    setLoading(true);
    await addGoal({
      name: name.trim(),
      targetAmount: amt,
      savedAmount: savedAmt,
      deadline: deadline.trim(),
      emoji,
      monthlyContribution: monthlyAmt,
    });
    setLoading(false);
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Create Goal 🎯</Text>
          <Text style={styles.subtitle}>Set a new savings target</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* ── Choose Icon ── */}
        <Text style={styles.sectionLabel}>Choose Icon</Text>
        <View style={styles.iconGrid}>
          {GOAL_ICONS.map(e => (
            <TouchableOpacity
              key={e}
              style={[styles.iconBtn, emoji === e && styles.iconBtnActive]}
              onPress={() => setEmoji(e)}
            >
              <Text style={styles.iconText}>{e}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Fields ── */}
        <View style={styles.formCard}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Goal Name 🎯</Text>
            <TextInput
              style={styles.fieldInput}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Emergency Fund"
              placeholderTextColor={Colors.textTertiary}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Target Amount 💰</Text>
            <TextInput
              style={styles.fieldInput}
              value={target}
              onChangeText={setTarget}
              keyboardType="decimal-pad"
              placeholder="Rs. 1,00,000"
              placeholderTextColor={Colors.textTertiary}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Current Savings 💵</Text>
            <TextInput
              style={styles.fieldInput}
              value={currentSavings}
              onChangeText={setCurrentSavings}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={Colors.textTertiary}
            />
          </View>
        </View>

        {/* ── Date + Priority ── */}
        <View style={styles.rowTwo}>
          <View style={[styles.formCard, { flex: 1 }]}>
            <View style={styles.fieldRow}>
              <View>
                <Text style={styles.fieldLabel}>Target Date 📅</Text>
                <TextInput
                  style={[styles.fieldInput, { textAlign: 'left', marginTop: 4 }]}
                  value={deadline}
                  onChangeText={setDeadline}
                  placeholder="Dec 2026"
                  placeholderTextColor={Colors.textTertiary}
                />
              </View>
            </View>
          </View>
          <View style={[styles.formCard, { flex: 1 }]}>
            <View style={styles.fieldRow}>
              <View>
                <Text style={styles.fieldLabel}>Priority ⚡</Text>
                <View style={styles.priorityRow}>
                  {PRIORITIES.map(p => (
                    <TouchableOpacity
                      key={p}
                      onPress={() => setPriority(p)}
                      style={[styles.priorityChip, priority === p && styles.priorityChipActive]}
                    >
                      <Text style={[styles.priorityText, priority === p && styles.priorityTextActive]}>
                        {p}{priority === p && p === 'High' ? ' 🔥' : ''}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ── Color ── */}
        <Text style={styles.sectionLabel}>Color 🎨</Text>
        <View style={styles.colorRow}>
          {GOAL_COLORS.map(c => (
            <TouchableOpacity
              key={c}
              style={[styles.colorDot, { backgroundColor: c }, goalColor === c && styles.colorDotActive]}
              onPress={() => setGoalColor(c)}
            />
          ))}
        </View>

        {/* ── Auto-contribute ── */}
        <View style={styles.toggleCard}>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>✏️ Auto-contribute monthly</Text>
            <Switch
              value={autoContribute}
              onValueChange={setAutoContribute}
              trackColor={{ true: Colors.primary, false: Colors.border }}
              thumbColor={Colors.card}
            />
          </View>
          {autoContribute && (
            <View style={[styles.fieldRow, { paddingTop: 0 }]}>
              <Text style={styles.fieldLabel}>Monthly Rs.</Text>
              <TextInput
                style={styles.fieldInput}
                value={monthly}
                onChangeText={setMonthly}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={Colors.textTertiary}
              />
            </View>
          )}
        </View>

        {/* ── Create Button ── */}
        <TouchableOpacity
          style={[styles.createBtn, loading && { opacity: 0.7 }]}
          onPress={handleCreate}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={styles.createBtnText}>{loading ? 'Creating…' : 'Create Goal 🎯'}</Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
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
  title: { fontSize: Theme.fontSize.lg, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.3 },
  subtitle: { fontSize: Theme.fontSize.xs, color: Colors.textTertiary, marginTop: 1 },

  content: { padding: Theme.spacing.lg, paddingBottom: 40 },

  sectionLabel: { fontSize: Theme.fontSize.sm, fontWeight: '700', color: Colors.textPrimary, marginBottom: Theme.spacing.sm },

  // Icon grid
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Theme.spacing.lg },
  iconBtn: { width: 58, height: 58, borderRadius: Theme.radius.md, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent', ...Theme.shadow.card },
  iconBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  iconText: { fontSize: 28 },

  // Form card
  formCard: { backgroundColor: Colors.card, borderRadius: Theme.radius.lg, marginBottom: Theme.spacing.md, ...Theme.shadow.card, overflow: 'hidden' },
  fieldRow: { paddingHorizontal: Theme.spacing.md, paddingVertical: 12 },
  fieldLabel: { fontSize: Theme.fontSize.xs, color: Colors.textSecondary, fontWeight: '600', marginBottom: 4 },
  fieldInput: { fontSize: Theme.fontSize.md, color: Colors.textPrimary, fontWeight: '500', textAlign: 'right' },
  divider: { height: 1, backgroundColor: Colors.divider, marginHorizontal: Theme.spacing.md },

  // Row of two
  rowTwo: { flexDirection: 'row', gap: 12, marginBottom: 0 },

  // Priority
  priorityRow: { flexDirection: 'row', gap: 4, marginTop: 4 },
  priorityChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Theme.radius.full, backgroundColor: Colors.cardSubtle },
  priorityChipActive: { backgroundColor: Colors.primary },
  priorityText: { fontSize: 10, fontWeight: '600', color: Colors.textSecondary },
  priorityTextActive: { color: '#fff' },

  // Color
  colorRow: { flexDirection: 'row', gap: 12, marginBottom: Theme.spacing.lg },
  colorDot: { width: 38, height: 38, borderRadius: 19 },
  colorDotActive: { borderWidth: 3, borderColor: Colors.textPrimary, transform: [{ scale: 1.15 }] },

  // Auto-contribute
  toggleCard: { backgroundColor: Colors.card, borderRadius: Theme.radius.lg, marginBottom: Theme.spacing.lg, ...Theme.shadow.card, overflow: 'hidden' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Theme.spacing.md, paddingVertical: 14 },
  toggleLabel: { fontSize: Theme.fontSize.sm, fontWeight: '600', color: Colors.textPrimary },

  // Create button
  createBtn: { height: 56, borderRadius: Theme.radius.xl, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', ...Theme.shadow.elevated },
  createBtnText: { color: '#fff', fontSize: Theme.fontSize.md, fontWeight: '700', letterSpacing: 0.3 },
});
