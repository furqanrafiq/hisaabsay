import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useFinance } from '@/context/FinanceContext';
import { CATEGORIES, getCategoryById } from '@/constants/categories';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { AppInput } from '@/components/common/AppInput';
import { AppButton } from '@/components/common/AppButton';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export function AddBudgetScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { addBudget, editBudget, budgets } = useFinance();

  const monthKey = route.params?.monthKey ?? new Date().toISOString().slice(0, 7);
  const editingBudget: { id: string; category: string; limit: number } | undefined = route.params?.budget;
  const isEditing = !!editingBudget;

  const [category, setCategory] = useState(editingBudget?.category ?? 'food');
  const [limit, setLimit] = useState(editingBudget ? String(editingBudget.limit) : '');
  const [loading, setLoading] = useState(false);

  const expenseCats = CATEGORIES.filter((c) => c.type === 'expense' || c.type === 'both');
  const existingCatIds = budgets
    .filter((b) => b.month === monthKey && b.id !== editingBudget?.id)
    .map((b) => b.category);

  const editingCat = isEditing ? getCategoryById(editingBudget.category) : null;

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
      await addBudget({ category, limit: amt, month: monthKey });
    }
    setLoading(false);
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.cancel}>Cancel</Text></TouchableOpacity>
        <Text style={styles.title}>{isEditing ? 'Edit Budget' : 'Add Budget'}</Text>
        <View style={{ width: 60 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* When editing, show locked category */}
        {isEditing && editingCat && (
          <View style={styles.editingCatRow}>
            <View style={[styles.editingCatIcon, { backgroundColor: editingCat.color + '33' }]}>
              <MaterialCommunityIcons name={editingCat.icon as any} size={20} color={editingCat.color} />
            </View>
            <View>
              <Text style={styles.editingCatLabel}>Category</Text>
              <Text style={styles.editingCatName}>{editingCat.name}</Text>
            </View>
            <MaterialCommunityIcons name="lock-outline" size={16} color={Colors.textSecondary} style={{ marginLeft: 'auto' }} />
          </View>
        )}

        <AppInput
          label="Monthly Limit"
          value={limit}
          onChangeText={setLimit}
          keyboardType="decimal-pad"
          placeholder="0.00"
          autoFocus={isEditing}
        />

        {/* Category picker — only shown when adding new */}
        {!isEditing && (
          <>
            <Text style={styles.sectionLabel}>Category</Text>
            <View style={styles.catGrid}>
              {expenseCats.map((c) => {
                const used = existingCatIds.includes(c.id);
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.catItem, category === c.id && styles.catItemActive, used && styles.catUsed]}
                    onPress={() => !used && setCategory(c.id)}
                    disabled={used}
                  >
                    <View style={[styles.catIcon, { backgroundColor: c.color + '33' }]}>
                      <MaterialCommunityIcons name={c.icon as any} size={20} color={used ? Colors.textSecondary : c.color} />
                    </View>
                    <Text style={[styles.catLabel, used && { color: Colors.textSecondary }]} numberOfLines={1}>{c.name}</Text>
                    {used && <Text style={styles.usedTag}>Set</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        <AppButton
          title={isEditing ? 'Save Changes' : 'Set Budget'}
          onPress={handleSave}
          loading={loading}
          style={{ marginTop: Theme.spacing.lg }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Theme.spacing.md, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  cancel: { fontSize: Theme.fontSize.md, color: Colors.primary },
  title: { fontSize: Theme.fontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  content: { padding: Theme.spacing.lg, paddingBottom: 40 },
  editingCatRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.card, borderRadius: Theme.radius.lg, padding: Theme.spacing.md, marginBottom: Theme.spacing.md },
  editingCatIcon: { width: 44, height: 44, borderRadius: Theme.radius.md, alignItems: 'center', justifyContent: 'center' },
  editingCatLabel: { fontSize: Theme.fontSize.xs, color: Colors.textSecondary },
  editingCatName: { fontSize: Theme.fontSize.md, fontWeight: '600', color: Colors.textPrimary },
  sectionLabel: { fontSize: Theme.fontSize.sm, fontWeight: '500', color: Colors.textSecondary, marginBottom: Theme.spacing.sm },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catItem: { width: '30%', alignItems: 'center', padding: Theme.spacing.sm, borderRadius: Theme.radius.md, backgroundColor: Colors.card, borderWidth: 2, borderColor: 'transparent' },
  catItemActive: { borderColor: Colors.primary, backgroundColor: Colors.cardMint },
  catUsed: { opacity: 0.5 },
  catIcon: { width: 40, height: 40, borderRadius: Theme.radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  catLabel: { fontSize: Theme.fontSize.xs, color: Colors.textPrimary, textAlign: 'center' },
  usedTag: { fontSize: 9, color: Colors.textSecondary, marginTop: 2 },
});
