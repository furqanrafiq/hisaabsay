import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useFinance } from '@/context/FinanceContext';
import { useAuth } from '@/context/AuthContext';
import { CATEGORIES } from '@/constants/categories';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { AppInput } from '@/components/common/AppInput';
import { AppButton } from '@/components/common/AppButton';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatCurrency } from '@/utils/formatCurrency';
import { getMonthKey } from '@/utils/formatDate';
import { format } from 'date-fns';

export function AddTransactionScreen() {
  const navigation = useNavigation<any>();
  const { addTransaction, customCategories, budgets, transactions } = useFinance();
  const { user } = useAuth();
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [note, setNote] = useState('');
  const [fixed, setFixed] = useState(false);
  const [loading, setLoading] = useState(false);

  const defaultCats = CATEGORIES.filter((c) => c.type === type || c.type === 'both');
  const customCats = customCategories.filter((c) => c.type === type || c.type === 'both');
  const allCats = [...defaultCats, ...customCats];

  const doAdd = async (overspendReason?: string) => {
    const amt = parseFloat(amount);
    setLoading(true);
    await addTransaction({
      type, amount: amt, category, note,
      date: format(new Date(), 'yyyy-MM-dd'),
      fixed,
      overspendReason: overspendReason ?? '',
    });
    setLoading(false);
    navigation.goBack();
  };

  const handleAdd = async () => {
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) { Alert.alert('Invalid amount'); return; }

    if (type === 'expense') {
      const monthKey = getMonthKey(new Date());
      const budget = budgets.find((b) => b.category === category && b.month === monthKey);
      if (budget) {
        const spent = transactions
          .filter((t) => t.type === 'expense' && t.category === category && t.date.startsWith(monthKey))
          .reduce((s, t) => s + t.amount, 0);
        if (spent + amt > budget.limit) {
          const overBy = formatCurrency(spent + amt - budget.limit, user?.currency ?? 'PKR');
          Alert.prompt(
            'Over Budget!',
            `This exceeds your budget for this category by ${overBy}. Please give a reason:`,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Add Anyway', onPress: (reason) => doAdd(reason || '') },
            ],
            'plain-text',
            '',
          );
          return;
        }
      }
    }

    await doAdd();
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.cancel}>Cancel</Text></TouchableOpacity>
        <Text style={styles.title}>Add Transaction</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Type Toggle */}
        <View style={styles.typeRow}>
          {(['expense', 'income'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.typeBtn, type === t && (t === 'income' ? styles.typeBtnIncome : styles.typeBtnExpense)]}
              onPress={() => { setType(t); setCategory(t === 'income' ? 'salary' : 'food'); }}
            >
              <Text style={[styles.typeBtnText, type === t && styles.typeBtnTextActive]}>
                {t === 'income' ? '+ Income' : '- Expense'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <AppInput label="Amount" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder={`0.00 ${user?.currency ?? 'PKR'}`} />
        <AppInput label="Note (optional)" value={note} onChangeText={setNote} placeholder="What was this for?" />

        {/* Fixed / Variable toggle */}
        <Text style={styles.sectionLabel}>Type</Text>
        <View style={styles.fixedRow}>
          {([false, true] as const).map((val) => (
            <TouchableOpacity
              key={String(val)}
              style={[styles.fixedBtn, fixed === val && styles.fixedBtnActive]}
              onPress={() => setFixed(val)}
            >
              <MaterialCommunityIcons
                name={val ? 'lock-outline' : 'refresh'}
                size={14}
                color={fixed === val ? Colors.textOnPrimary : Colors.textSecondary}
              />
              <Text style={[styles.fixedBtnText, fixed === val && styles.fixedBtnTextActive]}>
                {val ? 'Fixed' : 'Variable'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.catHeader}>
          <Text style={styles.sectionLabel}>Category</Text>
          <TouchableOpacity
            style={styles.addCatBtn}
            onPress={() => navigation.navigate('AddCategory', { type })}
          >
            <MaterialCommunityIcons name="plus" size={14} color={Colors.primary} />
            <Text style={styles.addCatText}>Add Custom</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.catGrid}>
          {allCats.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[styles.catItem, category === c.id && styles.catItemActive]}
              onPress={() => setCategory(c.id)}
            >
              <View style={[styles.catIcon, { backgroundColor: c.color + '33' }]}>
                <MaterialCommunityIcons name={c.icon as any} size={20} color={c.color} />
              </View>
              <Text style={styles.catLabel} numberOfLines={1}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <AppButton title="Add Transaction" onPress={handleAdd} loading={loading} style={{ marginTop: Theme.spacing.lg }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Theme.spacing.md, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  cancel: { fontSize: Theme.fontSize.md, color: Colors.primaryLight, fontWeight: '600' },
  title: { fontSize: Theme.fontSize.lg, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.3 },
  scroll: { flex: 1 },
  content: { padding: Theme.spacing.lg, paddingBottom: 40 },
  typeRow: { flexDirection: 'row', marginBottom: Theme.spacing.lg, backgroundColor: Colors.cardSubtle, borderRadius: Theme.radius.full, padding: 4 },
  typeBtn: { flex: 1, height: 42, borderRadius: Theme.radius.full, alignItems: 'center', justifyContent: 'center' },
  typeBtnExpense: { backgroundColor: Colors.expense },
  typeBtnIncome: { backgroundColor: Colors.income },
  typeBtnText: { fontSize: Theme.fontSize.sm, fontWeight: '700', color: Colors.textSecondary },
  typeBtnTextActive: { color: Colors.textOnPrimary },
  sectionLabel: { fontSize: Theme.fontSize.xs, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: Theme.spacing.sm },
  fixedRow: { flexDirection: 'row', gap: 8, marginBottom: Theme.spacing.lg, backgroundColor: Colors.cardSubtle, borderRadius: Theme.radius.full, padding: 4 },
  fixedBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 36, borderRadius: Theme.radius.full },
  fixedBtnActive: { backgroundColor: Colors.primary },
  fixedBtnText: { fontSize: Theme.fontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  fixedBtnTextActive: { color: Colors.textOnPrimary },
  catHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Theme.spacing.sm },
  addCatBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: Colors.primaryMuted, borderRadius: Theme.radius.full },
  addCatText: { fontSize: Theme.fontSize.xs, color: Colors.primary, fontWeight: '700' },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  catItem: { width: '30%', alignItems: 'center', padding: Theme.spacing.sm, borderRadius: Theme.radius.md, backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.border },
  catItemActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  catIcon: { width: 42, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  catLabel: { fontSize: Theme.fontSize.xs, color: Colors.textPrimary, textAlign: 'center', fontWeight: '600' },
});
