import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, Alert, TextInput,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useFinance } from '@/context/FinanceContext';
import { useAuth } from '@/context/AuthContext';
import { CATEGORIES } from '@/constants/categories';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { Transaction } from '@/types';
import { getCategoryById } from '@/constants/categories';
import { formatCurrency } from '@/utils/formatCurrency';
import { format } from 'date-fns';

function DetailRow({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailLeft}>
        <Text style={styles.detailEmoji}>{emoji}</Text>
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
      <Text style={styles.detailValue} numberOfLines={2}>{value || '—'}</Text>
    </View>
  );
}

export function EditTransactionScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { editTransaction, deleteTransaction, addTransaction, customCategories, accounts } = useFinance();
  const { user } = useAuth();
  const t: Transaction = route.params.transaction;
  const currency = t.currency || 'PKR';

  const [editMode, setEditMode] = useState(false);
  const [amount, setAmount] = useState(String(t.amount));
  const [category, setCategory] = useState(t.category);
  const [note, setNote] = useState(t.note);
  const [loading, setLoading] = useState(false);

  const cat = getCategoryById(t.category);
  const allCats = [...CATEGORIES.filter(c => c.type === t.type || c.type === 'both'), ...customCategories.filter(c => c.type === t.type || c.type === 'both')];
  const editCat = allCats.find(c => c.id === category) ?? cat;
  const account = accounts.find(a => a.id === t.accountId);
  const accountLabel = account ? `${account.emoji} ${account.name}${account.bank ? ` · ${account.bank}` : ''}` : '—';

  const formattedDate = (() => {
    try { return format(new Date(t.date), 'd MMMM yyyy'); } catch { return t.date; }
  })();
  const refId = `TXN-${t.date.slice(0, 4)}-${t.id.slice(-5).toUpperCase()}`;

  const handleSave = async () => {
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) { Alert.alert('Invalid amount'); return; }
    setLoading(true);
    await editTransaction(t.id, { amount: amt, category, note });
    setLoading(false);
    setEditMode(false);
  };

  const handleDelete = () => {
    Alert.alert('Delete Transaction', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteTransaction(t.id); navigation.goBack(); } },
    ]);
  };

  const handleDuplicate = async () => {
    await addTransaction({ type: t.type, amount: t.amount, category: t.category, note: t.note, date: t.date, fixed: t.fixed, overspendReason: '', currency: t.currency, accountId: t.accountId });
    Alert.alert('Duplicated', 'Transaction has been duplicated.');
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{editMode ? 'Edit Transaction' : 'Transaction Detail'}</Text>
        <TouchableOpacity
          style={styles.editBadge}
          onPress={() => editMode ? setEditMode(false) : setEditMode(true)}
        >
          <Text style={styles.editBadgeText}>{editMode ? '✕' : '✏️'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* ── Hero Card ── */}
        <View style={styles.heroCard}>
          <View style={[styles.heroIcon, { backgroundColor: cat.color + '22' }]}>
            <Text style={styles.heroEmoji}>{cat.emoji}</Text>
          </View>
          <View style={styles.heroInfo}>
            <Text style={styles.heroCategory}>{cat.name}</Text>
            {t.note ? <Text style={styles.heroNote}>{t.note}</Text> : null}
          </View>
          <Text style={[styles.heroAmount, { color: t.type === 'income' ? Colors.income : Colors.expense }]}>
            {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, currency)}
          </Text>
        </View>

        {/* ── DETAIL VIEW ── */}
        {!editMode && (
          <>
            <Text style={styles.sectionLabel}>Details</Text>
            <View style={styles.detailCard}>
              <DetailRow emoji="📅" label="Date" value={formattedDate} />
              <View style={styles.divider} />
              <DetailRow emoji="🏷️" label="Category" value={cat.name} />
              <View style={styles.divider} />
              <DetailRow emoji="🏦" label={t.type === 'income' ? 'Deposit to' : 'Pay from'} value={accountLabel} />
              <View style={styles.divider} />
              <DetailRow emoji="🔄" label="Type" value={t.fixed ? 'Fixed' : 'Variable'} />
              <View style={styles.divider} />
              <DetailRow emoji="🆔" label="Reference" value={refId} />
              <View style={styles.divider} />
              <DetailRow emoji="📝" label="Notes" value={t.note || '—'} />
            </View>

            {/* Duplicate + Delete */}
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.dupBtn} onPress={handleDuplicate}>
                <Text style={styles.dupText}>🗂️ Duplicate</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.delBtn} onPress={handleDelete}>
                <Text style={styles.delText}>🗑️ Delete</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={() => setEditMode(true)} activeOpacity={0.85}>
              <Text style={styles.saveBtnText}>Edit Transaction ✏️</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── EDIT VIEW ── */}
        {editMode && (
          <>
            <View style={styles.formCard}>
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Amount</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={Colors.textTertiary}
                />
              </View>
              <View style={styles.divider} />
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Notes</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={note}
                  onChangeText={setNote}
                  placeholder="Add a note..."
                  placeholderTextColor={Colors.textTertiary}
                />
              </View>
            </View>

            <Text style={styles.sectionLabel}>Category</Text>
            <View style={styles.catGrid}>
              {allCats.map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.catItem, category === c.id && styles.catItemActive]}
                  onPress={() => setCategory(c.id)}
                >
                  <Text style={styles.catEmoji}>{c.emoji}</Text>
                  <Text style={[styles.catLabel, category === c.id && styles.catLabelActive]} numberOfLines={1}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, loading && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={styles.saveBtnText}>{loading ? 'Saving…' : 'Save Changes ✓'}</Text>
            </TouchableOpacity>
          </>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.lg, paddingTop: Theme.spacing.lg, paddingBottom: Theme.spacing.md,
    backgroundColor: Colors.background,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 22, color: Colors.textPrimary, fontWeight: '500' },
  title: { fontSize: Theme.fontSize.lg, fontWeight: '800', color: Colors.textPrimary },
  editBadge: { width: 38, height: 38, borderRadius: 10, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center', ...Theme.shadow.card },
  editBadgeText: { fontSize: 16 },

  content: { padding: Theme.spacing.lg, paddingBottom: 40 },

  // Hero
  heroCard: {
    backgroundColor: Colors.card, borderRadius: Theme.radius.lg, padding: Theme.spacing.md,
    flexDirection: 'row', alignItems: 'center', marginBottom: Theme.spacing.lg, ...Theme.shadow.card,
  },
  heroIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: Theme.spacing.md },
  heroEmoji: { fontSize: 28 },
  heroInfo: { flex: 1 },
  heroCategory: { fontSize: Theme.fontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  heroNote: { fontSize: Theme.fontSize.sm, color: Colors.textTertiary, marginTop: 3 },
  heroAmount: { fontSize: Theme.fontSize.xl, fontWeight: '800', letterSpacing: -0.5 },

  // Detail rows
  sectionLabel: { fontSize: Theme.fontSize.sm, fontWeight: '700', color: Colors.textSecondary, marginBottom: Theme.spacing.sm },
  detailCard: { backgroundColor: Colors.card, borderRadius: Theme.radius.lg, marginBottom: Theme.spacing.md, ...Theme.shadow.card },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Theme.spacing.md },
  detailLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  detailEmoji: { fontSize: 18 },
  detailLabel: { fontSize: Theme.fontSize.sm, color: Colors.textSecondary, fontWeight: '500' },
  detailValue: { fontSize: Theme.fontSize.sm, fontWeight: '600', color: Colors.textPrimary, maxWidth: '55%', textAlign: 'right' },
  divider: { height: 1, backgroundColor: Colors.divider, marginHorizontal: Theme.spacing.md },

  // Action buttons
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: Theme.spacing.md },
  dupBtn: { flex: 1, height: 48, borderRadius: Theme.radius.lg, backgroundColor: Colors.cardSubtle, alignItems: 'center', justifyContent: 'center' },
  dupText: { fontSize: Theme.fontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  delBtn: { flex: 1, height: 48, borderRadius: Theme.radius.lg, backgroundColor: Colors.expense + '15', alignItems: 'center', justifyContent: 'center' },
  delText: { fontSize: Theme.fontSize.sm, fontWeight: '600', color: Colors.expense },

  // Save button
  saveBtn: { height: 56, borderRadius: Theme.radius.xl, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', ...Theme.shadow.elevated },
  saveBtnText: { color: '#fff', fontSize: Theme.fontSize.md, fontWeight: '700', letterSpacing: 0.3 },

  // Edit form
  formCard: { backgroundColor: Colors.card, borderRadius: Theme.radius.lg, marginBottom: Theme.spacing.md, ...Theme.shadow.card, overflow: 'hidden' },
  fieldRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Theme.spacing.md, paddingVertical: 14 },
  fieldLabel: { fontSize: Theme.fontSize.sm, color: Colors.textSecondary, fontWeight: '500', width: 80 },
  fieldInput: { flex: 1, fontSize: Theme.fontSize.sm, color: Colors.textPrimary, textAlign: 'right', fontWeight: '500' },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Theme.spacing.lg },
  catItem: { width: '30%', alignItems: 'center', padding: Theme.spacing.sm, borderRadius: Theme.radius.md, backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.border },
  catItemActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  catEmoji: { fontSize: 22, marginBottom: 4 },
  catLabel: { fontSize: Theme.fontSize.xs, color: Colors.textPrimary, textAlign: 'center', fontWeight: '600' },
  catLabelActive: { color: Colors.primary },
});
