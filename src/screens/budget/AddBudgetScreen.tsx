import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, KeyboardAvoidingView, Platform, TextInput, Switch,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useFinance } from '@/context/FinanceContext';
import { CATEGORIES, getCategoryById } from '@/constants/categories';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';

export function AddBudgetScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { addBudget, editBudget, budgets, accounts, activeCurrency, activeAccountId } = useFinance();

  const monthKey = route.params?.monthKey ?? new Date().toISOString().slice(0, 7);
  const editingBudget: { id: string; category: string; limit: number; accountId?: string; currency?: string } | undefined = route.params?.budget;
  const isEditing = !!editingBudget;

  // A new budget inherits the active wallet scope; editing keeps the existing scope.
  const scopeAccountId = isEditing ? (editingBudget?.accountId ?? '') : (activeAccountId ?? '');
  const scopeCurrency = isEditing ? (editingBudget?.currency ?? activeCurrency) : activeCurrency;
  const scopeAccount = scopeAccountId ? accounts.find((a) => a.id === scopeAccountId) : null;
  const scopeLabel = scopeAccount ? `${scopeAccount.emoji} ${scopeAccount.name}` : `💼 All ${scopeCurrency}`;

  const existingCatIds = budgets
    .filter(b =>
      b.month === monthKey
      && b.currency === scopeCurrency
      && (b.accountId ?? '') === scopeAccountId
      && b.id !== editingBudget?.id,
    )
    .map(b => b.category);

  const expenseCats = CATEGORIES.filter(c => c.type === 'expense' || c.type === 'both');
  const editingCat = isEditing ? getCategoryById(editingBudget.category) : null;

  const [category, setCategory] = useState(editingBudget?.category ?? 'food');
  const [limit, setLimit] = useState(editingBudget ? String(editingBudget.limit) : '');
  const [alertPct, setAlertPct] = useState('80');
  const [notify, setNotify] = useState(true);
  const [rollover, setRollover] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedCat = getCategoryById(category);

  const handleSave = async () => {
    const amt = parseFloat(limit);
    if (!limit || isNaN(amt) || amt <= 0) { Alert.alert('Enter a valid limit'); return; }
    if (!isEditing && existingCatIds.includes(category)) {
      Alert.alert('Budget for this category already exists for this month');
      return;
    }
    setLoading(true);
    if (isEditing) {
      await editBudget(editingBudget.id, { limit: amt });
    } else {
      await addBudget({ category, limit: amt, month: monthKey, currency: scopeCurrency, accountId: scopeAccountId });
    }
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
          <Text style={styles.title}>{isEditing ? 'Edit Budget 📊' : 'Add Budget 📊'}</Text>
          <Text style={styles.subtitle}>Set a monthly spending limit</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* ── Scope chip ── */}
        <View style={styles.scopeChip}>
          <Text style={styles.scopeChipLabel}>Scope</Text>
          <Text style={styles.scopeChipValue} numberOfLines={1}>{scopeLabel}</Text>
        </View>

        {/* ── Category Grid ── */}
        {!isEditing ? (
          <>
            <Text style={styles.sectionLabel}>Category</Text>
            <View style={styles.catGrid}>
              {expenseCats.map(c => {
                const used = existingCatIds.includes(c.id);
                const active = category === c.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.catItem, active && styles.catItemActive, used && styles.catUsed]}
                    onPress={() => !used && setCategory(c.id)}
                    disabled={used}
                  >
                    <View style={[styles.catIconWrap, { backgroundColor: c.color + '22' }]}>
                      <Text style={styles.catEmoji}>{c.emoji}</Text>
                    </View>
                    <Text style={[styles.catLabel, active && styles.catLabelActive]} numberOfLines={2}>{c.name}</Text>
                    {used && <Text style={styles.usedTag}>Set</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        ) : (
          <View style={styles.editingCatCard}>
            <View style={[styles.editingCatIcon, { backgroundColor: editingCat!.color + '22' }]}>
              <Text style={{ fontSize: 22 }}>{editingCat!.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.editingCatLabel}>Category</Text>
              <Text style={styles.editingCatName}>{editingCat!.name}</Text>
            </View>
            <Text style={{ fontSize: 16 }}>🔒</Text>
          </View>
        )}

        {/* ── Form Fields ── */}
        <View style={styles.formCard}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Category Name 🏷️</Text>
            <Text style={styles.fieldValue}>{selectedCat.name}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Monthly Limit 💰</Text>
            <TextInput
              style={styles.fieldInput}
              value={limit}
              onChangeText={setLimit}
              keyboardType="decimal-pad"
              placeholder="e.g. Rs. 25,000"
              placeholderTextColor={Colors.textTertiary}
              autoFocus={isEditing}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Alert at % Spent ⚠️</Text>
            <TextInput
              style={styles.fieldInput}
              value={alertPct}
              onChangeText={setAlertPct}
              keyboardType="decimal-pad"
              placeholder="e.g. 80%"
              placeholderTextColor={Colors.textTertiary}
            />
          </View>
        </View>

        {/* ── Toggles ── */}
        <View style={styles.toggleCard}>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>🔔 Notify when over budget</Text>
            <Switch
              value={notify}
              onValueChange={setNotify}
              trackColor={{ true: Colors.primary, false: Colors.border }}
              thumbColor={Colors.card}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>🔄 Rollover unused amount</Text>
            <Switch
              value={rollover}
              onValueChange={setRollover}
              trackColor={{ true: Colors.primary, false: Colors.border }}
              thumbColor={Colors.card}
            />
          </View>
        </View>

        {/* ── Notes ── */}
        <View style={styles.formCard}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Notes 📝</Text>
            <TextInput
              style={[styles.fieldInput, { minWidth: '60%' }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Optional notes"
              placeholderTextColor={Colors.textTertiary}
            />
          </View>
        </View>

        {/* ── Save Button ── */}
        <TouchableOpacity
          style={[styles.saveBtn, loading && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={styles.saveBtnText}>{loading ? 'Saving…' : 'Save Budget ✓'}</Text>
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

  // Scope
  scopeChip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10,
    backgroundColor: Colors.card, borderRadius: Theme.radius.lg,
    paddingHorizontal: Theme.spacing.md, paddingVertical: 12,
    marginBottom: Theme.spacing.md, ...Theme.shadow.card,
  },
  scopeChipLabel: { fontSize: Theme.fontSize.xs, color: Colors.textTertiary, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  scopeChipValue: { flex: 1, textAlign: 'right', fontSize: Theme.fontSize.sm, fontWeight: '700', color: Colors.textPrimary },

  // Category grid
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: Theme.spacing.lg },
  catItem: {
    width: '22%', alignItems: 'center', padding: Theme.spacing.sm,
    borderRadius: Theme.radius.md, backgroundColor: Colors.card,
    borderWidth: 2, borderColor: 'transparent', ...Theme.shadow.card,
  },
  catItemActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  catUsed: { opacity: 0.4 },
  catIconWrap: { width: 48, height: 48, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  catEmoji: { fontSize: 24 },
  catLabel: { fontSize: 10, color: Colors.textSecondary, textAlign: 'center', fontWeight: '600' },
  catLabelActive: { color: Colors.primary },
  usedTag: { fontSize: 8, color: Colors.textTertiary, marginTop: 2, fontWeight: '600' },

  // Editing cat card
  editingCatCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.card, borderRadius: Theme.radius.lg, padding: Theme.spacing.md, marginBottom: Theme.spacing.md, ...Theme.shadow.card },
  editingCatIcon: { width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  editingCatLabel: { fontSize: Theme.fontSize.xs, color: Colors.textSecondary },
  editingCatName: { fontSize: Theme.fontSize.md, fontWeight: '700', color: Colors.textPrimary },

  // Form
  formCard: { backgroundColor: Colors.card, borderRadius: Theme.radius.lg, marginBottom: Theme.spacing.md, ...Theme.shadow.card, overflow: 'hidden' },
  fieldRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Theme.spacing.md, paddingVertical: 14 },
  fieldLabel: { fontSize: Theme.fontSize.sm, color: Colors.textSecondary, fontWeight: '500', flex: 1 },
  fieldValue: { fontSize: Theme.fontSize.sm, fontWeight: '600', color: Colors.textPrimary },
  fieldInput: { fontSize: Theme.fontSize.sm, color: Colors.textPrimary, fontWeight: '500', textAlign: 'right' },
  divider: { height: 1, backgroundColor: Colors.divider, marginHorizontal: Theme.spacing.md },

  // Toggles
  toggleCard: { backgroundColor: Colors.card, borderRadius: Theme.radius.lg, marginBottom: Theme.spacing.md, ...Theme.shadow.card, overflow: 'hidden' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Theme.spacing.md, paddingVertical: 14 },
  toggleLabel: { fontSize: Theme.fontSize.sm, fontWeight: '600', color: Colors.textPrimary },

  // Save
  saveBtn: { height: 56, borderRadius: Theme.radius.xl, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', ...Theme.shadow.elevated },
  saveBtnText: { color: '#fff', fontSize: Theme.fontSize.md, fontWeight: '700', letterSpacing: 0.3 },
});
