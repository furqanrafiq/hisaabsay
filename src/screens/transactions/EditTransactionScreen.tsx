import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useFinance } from '@/context/FinanceContext';
import { useAuth } from '@/context/AuthContext';
import { CATEGORIES } from '@/constants/categories';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { AppInput } from '@/components/common/AppInput';
import { AppButton } from '@/components/common/AppButton';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Transaction } from '@/types';

export function EditTransactionScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { editTransaction, deleteTransaction, customCategories } = useFinance();
  const { user } = useAuth();
  const t: Transaction = route.params.transaction;

  const [amount, setAmount] = useState(String(t.amount));
  const [category, setCategory] = useState(t.category);
  const [note, setNote] = useState(t.note);
  const [loading, setLoading] = useState(false);

  const defaultCats = CATEGORIES.filter((c) => c.type === t.type || c.type === 'both');
  const customCats = customCategories.filter((c) => c.type === t.type || c.type === 'both');
  const cats = [...defaultCats, ...customCats];

  const handleSave = async () => {
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) { Alert.alert('Invalid amount'); return; }
    setLoading(true);
    await editTransaction(t.id, { amount: amt, category, note });
    setLoading(false);
    navigation.goBack();
  };

  const handleDelete = () => {
    Alert.alert('Delete', 'Delete this transaction?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteTransaction(t.id); navigation.goBack(); } },
    ]);
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.cancel}>Cancel</Text></TouchableOpacity>
        <Text style={styles.title}>Edit Transaction</Text>
        <TouchableOpacity onPress={handleDelete}><Text style={styles.deleteBtn}>Delete</Text></TouchableOpacity>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={[styles.typeBadge, { backgroundColor: t.type === 'income' ? Colors.income + '22' : Colors.expense + '22' }]}>
          <Text style={{ color: t.type === 'income' ? Colors.income : Colors.expense, fontWeight: '600' }}>
            {t.type === 'income' ? '+ Income' : '- Expense'}
          </Text>
        </View>
        <AppInput label="Amount" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder={`0.00 ${user?.currency ?? 'PKR'}`} />
        <AppInput label="Note" value={note} onChangeText={setNote} placeholder="What was this for?" />
        <Text style={styles.sectionLabel}>Category</Text>
        <View style={styles.catGrid}>
          {cats.map((c) => (
            <TouchableOpacity key={c.id} style={[styles.catItem, category === c.id && styles.catItemActive]} onPress={() => setCategory(c.id)}>
              <View style={[styles.catIcon, { backgroundColor: c.color + '33' }]}>
                <MaterialCommunityIcons name={c.icon as any} size={20} color={c.color} />
              </View>
              <Text style={styles.catLabel} numberOfLines={1}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <AppButton title="Save Changes" onPress={handleSave} loading={loading} style={{ marginTop: Theme.spacing.lg }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Theme.spacing.md, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  cancel: { fontSize: Theme.fontSize.md, color: Colors.primary },
  title: { fontSize: Theme.fontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  deleteBtn: { fontSize: Theme.fontSize.md, color: Colors.expense },
  typeBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: Theme.radius.full, marginBottom: Theme.spacing.md },
  scroll: { flex: 1 },
  content: { padding: Theme.spacing.lg, paddingBottom: 40 },
  sectionLabel: { fontSize: Theme.fontSize.sm, fontWeight: '500', color: Colors.textSecondary, marginBottom: Theme.spacing.sm },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catItem: { width: '30%', alignItems: 'center', padding: Theme.spacing.sm, borderRadius: Theme.radius.md, backgroundColor: Colors.card, borderWidth: 2, borderColor: 'transparent' },
  catItemActive: { borderColor: Colors.primary, backgroundColor: Colors.cardMint },
  catIcon: { width: 40, height: 40, borderRadius: Theme.radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  catLabel: { fontSize: Theme.fontSize.xs, color: Colors.textPrimary, textAlign: 'center' },
});
