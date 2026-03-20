import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useFinance } from '@/context/FinanceContext';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { AppInput } from '@/components/common/AppInput';
import { AppButton } from '@/components/common/AppButton';

const EMOJIS = ['🎯','🏠','🚗','✈️','💍','📱','💻','🎓','🏖️','💰','🐾','🎸'];

export function AddGoalScreen() {
  const navigation = useNavigation<any>();
  const { addGoal } = useFinance();
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [monthly, setMonthly] = useState('');
  const [emoji, setEmoji] = useState('🎯');
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!name.trim()) { Alert.alert('Enter a goal name'); return; }
    const amt = parseFloat(target);
    if (!target || isNaN(amt) || amt <= 0) { Alert.alert('Enter a valid target amount'); return; }
    const monthlyAmt = monthly ? parseFloat(monthly) : 0;
    setLoading(true);
    await addGoal({
      name: name.trim(),
      targetAmount: amt,
      savedAmount: 0,
      deadline: '',
      emoji,
      monthlyContribution: isNaN(monthlyAmt) ? 0 : monthlyAmt,
    });
    setLoading(false);
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.cancel}>Cancel</Text></TouchableOpacity>
        <Text style={styles.title}>New Goal</Text>
        <View style={{ width: 60 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <AppInput label="Goal Name" value={name} onChangeText={setName} placeholder="e.g. Emergency Fund" />
        <AppInput label="Target Amount" value={target} onChangeText={setTarget} keyboardType="decimal-pad" placeholder="0.00" />
        <AppInput label="Monthly Contribution (optional)" value={monthly} onChangeText={setMonthly} keyboardType="decimal-pad" placeholder="0.00" />
        <Text style={styles.sectionLabel}>Choose Emoji</Text>
        <View style={styles.emojiGrid}>
          {EMOJIS.map((e) => (
            <TouchableOpacity key={e} style={[styles.emojiBtn, emoji === e && styles.emojiBtnActive]} onPress={() => setEmoji(e)}>
              <Text style={styles.emojiText}>{e}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <AppButton title="Create Goal" onPress={handleAdd} loading={loading} style={{ marginTop: Theme.spacing.lg }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Theme.spacing.md, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  cancel: { fontSize: Theme.fontSize.md, color: Colors.primaryLight, fontWeight: '600' },
  title: { fontSize: Theme.fontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  content: { padding: Theme.spacing.lg, paddingBottom: 40 },
  sectionLabel: { fontSize: Theme.fontSize.xs, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: Theme.spacing.sm },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emojiBtn: { width: 52, height: 52, borderRadius: Theme.radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.card, borderWidth: 2, borderColor: 'transparent' },
  emojiBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  emojiText: { fontSize: 24 },
});
