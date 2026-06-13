import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, Alert, TextInput, Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useFinance } from '@/context/FinanceContext';
import { useAuth } from '@/context/AuthContext';
import { CATEGORIES } from '@/constants/categories';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { formatCurrency } from '@/utils/formatCurrency';
import { getMonthKey } from '@/utils/formatDate';
import { format } from 'date-fns';

const QUICK_CATS = ['food', 'transport', 'shopping', 'utilities', 'entertainment', 'health'];

export function AddTransactionScreen() {
  const navigation = useNavigation<any>();
  const { addTransaction, customCategories, budgets, transactions, currencies, activeCurrency, accounts, activeAccountId } = useFinance();
  const { user } = useAuth();

  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [note, setNote] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [showAllCats, setShowAllCats] = useState(false);
  const [showCurrencies, setShowCurrencies] = useState(false);
  const [showAccounts, setShowAccounts] = useState(false);
  const [currency, setCurrency] = useState(activeCurrency);
  const [accountId, setAccountId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const today = format(new Date(), 'd MMMM yyyy');
  const allCats = [...CATEGORIES.filter(c => c.type === type || c.type === 'both'), ...customCategories.filter(c => c.type === type || c.type === 'both')];
  const quickCats = CATEGORIES.filter(c => QUICK_CATS.includes(c.id) && (c.type === type || c.type === 'both'));
  const selectedCat = allCats.find(c => c.id === category) ?? CATEGORIES[0];
  const selectedCurrency = currencies.find(c => c.code === currency);
  const symbol = selectedCurrency?.symbol || currency;

  const currencyAccounts = useMemo(
    () => accounts.filter(a => a.currency === currency && !a.archived),
    [accounts, currency],
  );
  const selectedAccount = currencyAccounts.find(a => a.id === accountId);

  // Keep accountId valid for the chosen currency. Prefer the globally active one when it matches.
  useEffect(() => {
    if (selectedAccount) return;
    const preferred = currencyAccounts.find(a => a.id === activeAccountId) ?? currencyAccounts[0];
    setAccountId(preferred ? preferred.id : '');
  }, [currency, currencyAccounts, activeAccountId, selectedAccount]);

  const doAdd = async (overspendReason?: string) => {
    const amt = parseFloat(amount);
    setLoading(true);
    await addTransaction({
      type, amount: amt, category, note,
      date: format(new Date(), 'yyyy-MM-dd'),
      fixed: recurring,
      overspendReason: overspendReason ?? '',
      currency,
      accountId,
    });
    setLoading(false);
    navigation.goBack();
  };

  const openCreateCategory = () => {
    navigation.navigate('AddCategory', {
      type,
      onCreated: (created: { id: string }) => { setCategory(created.id); setShowAllCats(false); },
    });
  };

  const openCreateAccount = () => {
    navigation.navigate('AddAccount', {
      currency,
      onCreated: (created: { id: string }) => { setAccountId(created.id); setShowAccounts(false); },
    });
  };

  const handleSave = async () => {
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) { Alert.alert('Enter a valid amount'); return; }
    if (!accountId) { Alert.alert('Pick an account', `Add an account in ${currency} first.`); return; }

    if (type === 'expense') {
      const monthKey = getMonthKey(new Date());
      const budget = budgets.find(b => b.category === category && b.month === monthKey && b.currency === currency);
      if (budget) {
        const spent = transactions
          .filter(t => t.type === 'expense' && t.category === category && t.currency === currency && t.date.startsWith(monthKey))
          .reduce((s, t) => s + t.amount, 0);
        if (spent + amt > budget.limit) {
          const over = formatCurrency(spent + amt - budget.limit, currency);
          Alert.prompt('Over Budget!', `Exceeds budget by ${over}. Reason?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Add Anyway', onPress: (r) => doAdd(r || '') },
          ], 'plain-text', '');
          return;
        }
      }
    }
    await doAdd();
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Add Transaction</Text>
          <Text style={styles.subtitle}>Fill in the details below 📝</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* ── Amount Card ── */}
        <View style={styles.amountCard}>
          <View style={styles.amountLabelRow}>
            <Text style={styles.amountLabel}>Amount</Text>
            <TouchableOpacity style={styles.currencyChip} onPress={() => setShowCurrencies(v => !v)}>
              <Text style={styles.currencyChipText}>💼 {currency}</Text>
              <Text style={styles.currencyChipChevron}>{showCurrencies ? '∨' : '›'}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.amountRow}>
            <Text style={styles.amountPrefix}>{symbol}</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={Colors.textTertiary}
            />
          </View>
          {showCurrencies && (
            <View style={styles.currencyOptions}>
              {currencies.map(c => (
                <TouchableOpacity
                  key={c.code}
                  style={[styles.currencyOption, currency === c.code && styles.currencyOptionActive]}
                  onPress={() => { setCurrency(c.code); setShowCurrencies(false); }}
                >
                  <Text style={[styles.currencyOptionText, currency === c.code && styles.currencyOptionTextActive]}>
                    {c.code} · {c.symbol}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* ── Expense / Income Toggle ── */}
        <View style={styles.typeRow}>
          {(['expense', 'income'] as const).map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.typeBtn, type === t && styles.typeBtnActive]}
              onPress={() => { setType(t); setCategory(t === 'income' ? 'salary' : 'food'); }}
            >
              <Text style={[styles.typeBtnText, type === t && styles.typeBtnTextActive]}>
                {t === 'expense' ? '💸 Expense' : '💰 Income'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Form Fields ── */}
        <View style={styles.formCard}>
          {/* Category */}
          <TouchableOpacity style={styles.fieldRow} onPress={() => setShowAllCats(v => !v)}>
            <Text style={styles.fieldLabel}>Category 🏷️</Text>
            <View style={styles.fieldValueRow}>
              <Text style={styles.fieldEmoji}>{selectedCat.emoji}</Text>
              <Text style={styles.fieldValue}>{selectedCat.name}</Text>
              <Text style={styles.fieldChevron}>{showAllCats ? '∨' : '›'}</Text>
            </View>
          </TouchableOpacity>

          {showAllCats && (
            <View style={styles.catGrid}>
              {allCats.map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.catChip, category === c.id && styles.catChipActive]}
                  onPress={() => { setCategory(c.id); setShowAllCats(false); }}
                >
                  <Text style={styles.catChipEmoji}>{c.emoji}</Text>
                  <Text style={[styles.catChipText, category === c.id && styles.catChipTextActive]} numberOfLines={1}>{c.name}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={[styles.catChip, styles.catChipNew]} onPress={openCreateCategory}>
                <Text style={styles.catChipEmoji}>➕</Text>
                <Text style={[styles.catChipText, styles.catChipNewText]} numberOfLines={1}>New</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.divider} />

          {/* Account */}
          <TouchableOpacity style={styles.fieldRow} onPress={() => setShowAccounts(v => !v)}>
            <Text style={styles.fieldLabel}>{type === 'income' ? 'Deposit to 🏦' : 'Pay from 🏦'}</Text>
            <View style={styles.fieldValueRow}>
              {selectedAccount ? (
                <>
                  <Text style={styles.fieldEmoji}>{selectedAccount.emoji}</Text>
                  <Text style={styles.fieldValue} numberOfLines={1}>
                    {selectedAccount.name}{selectedAccount.bank ? ` · ${selectedAccount.bank}` : ''}
                  </Text>
                </>
              ) : (
                <Text style={[styles.fieldValue, { color: Colors.textTertiary }]}>None</Text>
              )}
              <Text style={styles.fieldChevron}>{showAccounts ? '∨' : '›'}</Text>
            </View>
          </TouchableOpacity>

          {showAccounts && (
            <View style={styles.catGrid}>
              {currencyAccounts.map(a => (
                <TouchableOpacity
                  key={a.id}
                  style={[styles.catChip, accountId === a.id && styles.catChipActive]}
                  onPress={() => { setAccountId(a.id); setShowAccounts(false); }}
                >
                  <Text style={styles.catChipEmoji}>{a.emoji}</Text>
                  <Text style={[styles.catChipText, accountId === a.id && styles.catChipTextActive]} numberOfLines={1}>
                    {a.name}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={[styles.catChip, styles.catChipNew]} onPress={openCreateAccount}>
                <Text style={styles.catChipEmoji}>➕</Text>
                <Text style={[styles.catChipText, styles.catChipNewText]} numberOfLines={1}>New</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.divider} />

          {/* Date */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Date 📅</Text>
            <Text style={styles.fieldValue}>{today}</Text>
          </View>

          <View style={styles.divider} />

          {/* Notes */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Notes 📝</Text>
            <TextInput
              style={[styles.fieldValue, styles.notesInput]}
              value={note}
              onChangeText={setNote}
              placeholder="Add a note..."
              placeholderTextColor={Colors.textTertiary}
            />
          </View>
        </View>

        {/* ── Quick Categories ── */}
        {!showAllCats && (
          <View style={styles.quickSection}>
            <Text style={styles.quickLabel}>Quick Categories</Text>
            <View style={styles.quickRow}>
              {quickCats.map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.quickChip, category === c.id && styles.quickChipActive]}
                  onPress={() => setCategory(c.id)}
                >
                  <Text style={styles.quickEmoji}>{c.emoji}</Text>
                  <Text style={[styles.quickText, category === c.id && styles.quickTextActive]}>{c.name.split(' ')[0]}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={[styles.quickChip, styles.quickChipNew]} onPress={openCreateCategory}>
                <Text style={styles.quickEmoji}>➕</Text>
                <Text style={[styles.quickText, styles.quickChipNewText]}>New</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Recurring ── */}
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>🔄 Recurring Transaction</Text>
          <Switch
            value={recurring}
            onValueChange={setRecurring}
            trackColor={{ true: Colors.primary, false: Colors.border }}
            thumbColor={Colors.card}
          />
        </View>

        {/* ── Save Button ── */}
        <TouchableOpacity
          style={[styles.saveBtn, loading && { opacity: 0.7 }]}
          onPress={handleSave}
          activeOpacity={0.85}
          disabled={loading}
        >
          <Text style={styles.saveBtnText}>
            {loading ? 'Saving…' : 'Save Transaction ✓'}
          </Text>
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
    backgroundColor: Colors.background,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 22, color: Colors.textPrimary, fontWeight: '500' },
  title: { fontSize: Theme.fontSize.lg, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.3 },
  subtitle: { fontSize: Theme.fontSize.xs, color: Colors.textTertiary, marginTop: 1 },

  content: { padding: Theme.spacing.lg, paddingBottom: 40 },

  // Amount
  amountCard: {
    backgroundColor: Colors.card, borderRadius: Theme.radius.lg,
    padding: Theme.spacing.lg, marginBottom: Theme.spacing.md, ...Theme.shadow.card,
  },
  amountLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  amountLabel: { fontSize: Theme.fontSize.xs, color: Colors.textSecondary, fontWeight: '600' },
  amountRow: { flexDirection: 'row', alignItems: 'center' },
  amountPrefix: { fontSize: Theme.fontSize.xl, fontWeight: '700', color: Colors.textSecondary, marginRight: 8 },
  amountInput: { flex: 1, fontSize: 36, fontWeight: '300', color: Colors.textPrimary, letterSpacing: -0.5 },
  currencyChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: Theme.radius.full, backgroundColor: Colors.cardSubtle },
  currencyChipText: { fontSize: Theme.fontSize.xs, fontWeight: '700', color: Colors.textPrimary, letterSpacing: 0.3 },
  currencyChipChevron: { fontSize: 12, color: Colors.textTertiary },
  currencyOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: Theme.spacing.md },
  currencyOption: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: Theme.radius.full, backgroundColor: Colors.cardSubtle, borderWidth: 1.5, borderColor: 'transparent' },
  currencyOptionActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  currencyOptionText: { fontSize: Theme.fontSize.xs, fontWeight: '700', color: Colors.textSecondary },
  currencyOptionTextActive: { color: Colors.primary },

  // Type toggle
  typeRow: {
    flexDirection: 'row', backgroundColor: Colors.card, borderRadius: Theme.radius.full,
    padding: 4, marginBottom: Theme.spacing.md, ...Theme.shadow.card,
  },
  typeBtn: { flex: 1, height: 44, borderRadius: Theme.radius.full, alignItems: 'center', justifyContent: 'center' },
  typeBtnActive: { backgroundColor: Colors.primary },
  typeBtnText: { fontSize: Theme.fontSize.sm, fontWeight: '700', color: Colors.textSecondary },
  typeBtnTextActive: { color: '#fff' },

  // Form card
  formCard: { backgroundColor: Colors.card, borderRadius: Theme.radius.lg, marginBottom: Theme.spacing.md, ...Theme.shadow.card, overflow: 'hidden' },
  fieldRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Theme.spacing.md, paddingVertical: 14 },
  fieldLabel: { fontSize: Theme.fontSize.sm, color: Colors.textSecondary, fontWeight: '500', width: 90 },
  fieldValueRow: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6 },
  fieldEmoji: { fontSize: 16 },
  fieldValue: { fontSize: Theme.fontSize.sm, fontWeight: '500', color: Colors.textPrimary, flex: 1, textAlign: 'right' },
  fieldChevron: { fontSize: 18, color: Colors.textTertiary, marginLeft: 4 },
  notesInput: { textAlign: 'right', minHeight: 20 },
  divider: { height: 1, backgroundColor: Colors.divider, marginHorizontal: Theme.spacing.md },

  // Category grid (expanded)
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: Theme.spacing.md, paddingTop: 0 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: Theme.radius.full, backgroundColor: Colors.cardSubtle, borderWidth: 1.5, borderColor: 'transparent' },
  catChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  catChipNew: { borderStyle: 'dashed', borderColor: Colors.primary, backgroundColor: 'transparent' },
  catChipNewText: { color: Colors.primary },
  catChipEmoji: { fontSize: 14 },
  catChipText: { fontSize: Theme.fontSize.xs, fontWeight: '600', color: Colors.textSecondary },
  catChipTextActive: { color: Colors.primary },

  // Quick categories
  quickSection: { marginBottom: Theme.spacing.md },
  quickLabel: { fontSize: Theme.fontSize.sm, fontWeight: '700', color: Colors.textPrimary, marginBottom: Theme.spacing.sm },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: Theme.radius.full, backgroundColor: Colors.card, ...Theme.shadow.card },
  quickChipActive: { backgroundColor: Colors.primary },
  quickChipNew: { backgroundColor: 'transparent', borderWidth: 1.5, borderStyle: 'dashed', borderColor: Colors.primary },
  quickChipNewText: { color: Colors.primary },
  quickEmoji: { fontSize: 14 },
  quickText: { fontSize: Theme.fontSize.xs, fontWeight: '600', color: Colors.textSecondary },
  quickTextActive: { color: '#fff' },

  // Recurring toggle
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.card, borderRadius: Theme.radius.lg, padding: Theme.spacing.md,
    marginBottom: Theme.spacing.lg, ...Theme.shadow.card,
  },
  toggleLabel: { fontSize: Theme.fontSize.sm, fontWeight: '600', color: Colors.textPrimary },

  // Save button
  saveBtn: {
    height: 56, borderRadius: Theme.radius.xl, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center', ...Theme.shadow.elevated,
  },
  saveBtnText: { color: '#fff', fontSize: Theme.fontSize.md, fontWeight: '700', letterSpacing: 0.3 },
});
