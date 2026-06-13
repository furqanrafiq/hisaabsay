import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useFinance } from '@/context/FinanceContext';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { AppInput } from '@/components/common/AppInput';
import { AppButton } from '@/components/common/AppButton';
import { Account } from '@/types';

const DEFAULT_EMOJI = '🏦';
const DEFAULT_COLOR = '#1E293B';

const FALLBACK_CURRENCIES = [
  { code: 'PKR', name: 'Pakistani Rupee', symbol: 'Rs' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'SAR' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
];

export function AddAccountScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { currencies, accounts, addAccount, editAccount, activeCurrency } = useFinance();
  const currencyList = currencies.length > 0 ? currencies : FALLBACK_CURRENCIES;

  const existing: Account | undefined = route.params?.account;
  const isEdit = !!existing;
  const presetCurrency: string = existing?.currency ?? route.params?.currency ?? activeCurrency;

  const [name, setName] = useState(existing?.name ?? '');
  const [bank, setBank] = useState(existing?.bank ?? '');
  const [currency, setCurrency] = useState(presetCurrency);
  const [openingBalance, setOpeningBalance] = useState(existing ? String(existing.openingBalance) : '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Enter an account name'); return; }
    const opening = parseFloat(openingBalance);
    const ob = isNaN(opening) ? 0 : opening;
    const emoji = existing?.emoji ?? DEFAULT_EMOJI;
    const color = existing?.color ?? DEFAULT_COLOR;

    const doSave = async () => {
      setLoading(true);
      try {
        if (isEdit) {
          const updated = await editAccount(existing!.id, { name: name.trim(), bank: bank.trim(), currency, openingBalance: ob });
          route.params?.onCreated?.(updated);
        } else {
          const created = await addAccount({ name: name.trim(), bank: bank.trim(), currency, openingBalance: ob, emoji, color, archived: false });
          route.params?.onCreated?.(created);
        }
        navigation.goBack();
      } catch (e: any) {
        Alert.alert('Could not save account', e?.message ?? 'Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (isEdit && existing && ob !== existing.openingBalance) {
      Alert.alert(
        'Change opening balance?',
        'This will re-align the historical balance for this account.',
        [{ text: 'Cancel', style: 'cancel' }, { text: 'Save', onPress: doSave }],
      );
      return;
    }
    await doSave();
  };

  const currencySymbol = currencyList.find(c => c.code === currency)?.symbol ?? currency;
  const accountCount = accounts.filter(a => a.currency === currency).length;

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.cancel}>Cancel</Text></TouchableOpacity>
        <Text style={styles.title}>{isEdit ? 'Edit Account' : 'New Account'}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.preview}>
          <Text style={styles.previewName}>{name || 'Account name'}</Text>
          <Text style={styles.previewMeta}>{(bank || 'Bank') + ' · ' + currency}</Text>
        </View>

        <AppInput label="Account Name" value={name} onChangeText={setName} placeholder="e.g. Salary, Savings, Cash" />
        <AppInput label="Bank" value={bank} onChangeText={setBank} placeholder="e.g. Meezan, HBL, Al Rajhi, Chase" />
        <AppInput
          label={`Opening Balance (${currencySymbol})`}
          value={openingBalance}
          onChangeText={setOpeningBalance}
          keyboardType="decimal-pad"
          placeholder="0.00"
        />

        <Text style={styles.sectionLabel}>Currency {isEdit ? '' : '*'}</Text>
        <View style={styles.currencyRow}>
          {currencyList.map(c => {
            const active = currency === c.code;
            const disabled = isEdit && c.code !== currency;
            return (
              <TouchableOpacity
                key={c.code}
                style={[styles.currencyCard, active && styles.currencyCardActive, disabled && styles.chipDisabled]}
                onPress={() => !isEdit && setCurrency(c.code)}
                disabled={isEdit}
                activeOpacity={0.85}
              >
                <Text style={[styles.currencyCode, active && styles.currencyCodeActive]}>{c.code}</Text>
                <Text style={[styles.currencySymbol, active && styles.currencySymbolActive]}>{c.symbol}</Text>
                <Text style={styles.currencyName} numberOfLines={1}>{c.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {isEdit
          ? <Text style={styles.helper}>Currency can't be changed after creation.</Text>
          : <Text style={styles.helper}>Pick the currency this account holds.</Text>}

        {!isEdit && accountCount === 0 && (
          <Text style={styles.helper}>This will be your first {currency} account.</Text>
        )}

        <AppButton title={isEdit ? 'Save Changes' : 'Create Account'} onPress={handleSave} loading={loading} style={{ marginTop: Theme.spacing.lg }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Theme.spacing.md, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  cancel: { fontSize: Theme.fontSize.md, color: Colors.primary },
  title: { fontSize: Theme.fontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  content: { padding: Theme.spacing.lg, paddingBottom: 40 },
  preview: { alignItems: 'center', marginBottom: Theme.spacing.lg, padding: Theme.spacing.lg, backgroundColor: Colors.card, borderRadius: Theme.radius.xl },
  previewName: { fontSize: Theme.fontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  previewMeta: { fontSize: Theme.fontSize.xs, color: Colors.textTertiary, marginTop: 4 },
  sectionLabel: { fontSize: Theme.fontSize.sm, fontWeight: '500', color: Colors.textSecondary, marginBottom: Theme.spacing.sm, marginTop: Theme.spacing.sm },
  chipDisabled: { opacity: 0.5 },
  helper: { fontSize: Theme.fontSize.xs, color: Colors.textTertiary, marginTop: 6 },
  currencyRow: { flexDirection: 'row', gap: 10 },
  currencyCard: {
    flex: 1, padding: Theme.spacing.md, borderRadius: Theme.radius.lg,
    backgroundColor: Colors.cardSubtle, borderWidth: 2, borderColor: 'transparent',
    alignItems: 'center',
  },
  currencyCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  currencyCode: { fontSize: Theme.fontSize.md, fontWeight: '800', color: Colors.textPrimary, letterSpacing: 0.5 },
  currencyCodeActive: { color: Colors.primary },
  currencySymbol: { fontSize: Theme.fontSize.sm, fontWeight: '700', color: Colors.textSecondary, marginTop: 2 },
  currencySymbolActive: { color: Colors.primary },
  currencyName: { fontSize: Theme.fontSize.xs, color: Colors.textTertiary, marginTop: 4 },
});
