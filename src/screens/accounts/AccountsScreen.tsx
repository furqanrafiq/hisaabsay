import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useFinance } from '@/context/FinanceContext';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { formatCurrency } from '@/utils/formatCurrency';
import { Account } from '@/types';

export function AccountsScreen() {
  const navigation = useNavigation<any>();
  const { accounts, transactions, deleteAccount, reassignAccountTransactions } = useFinance();

  const balances = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of accounts) map.set(a.id, a.openingBalance);
    for (const t of transactions) {
      if (!t.accountId) continue;
      const cur = map.get(t.accountId) ?? 0;
      map.set(t.accountId, cur + (t.type === 'income' ? t.amount : -t.amount));
    }
    return map;
  }, [accounts, transactions]);

  const grouped = useMemo(() => {
    const by: Record<string, Account[]> = {};
    for (const a of accounts) {
      if (a.archived) continue;
      (by[a.currency] ||= []).push(a);
    }
    return Object.entries(by).sort(([a], [b]) => a.localeCompare(b));
  }, [accounts]);

  const txCount = (id: string) => transactions.filter(t => t.accountId === id).length;

  const handleDelete = (a: Account) => {
    const n = txCount(a.id);
    if (n === 0) {
      Alert.alert('Delete account', `Delete "${a.name}"?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => {
            try { await deleteAccount(a.id); } catch (e: any) { Alert.alert('Failed', e?.message ?? ''); }
          } },
      ]);
      return;
    }
    const others = accounts.filter(o => o.id !== a.id && o.currency === a.currency && !o.archived);
    if (others.length === 0) {
      Alert.alert('Cannot delete', `"${a.name}" has ${n} transaction(s) and is the only ${a.currency} account. Create another ${a.currency} account first.`);
      return;
    }
    Alert.alert(
      'Reassign transactions',
      `"${a.name}" has ${n} transaction(s). Move them to another account before deleting:`,
      [
        { text: 'Cancel', style: 'cancel' },
        ...others.slice(0, 3).map(o => ({
          text: `→ ${o.name}`,
          onPress: async () => {
            try {
              await reassignAccountTransactions(a.id, o.id);
              await deleteAccount(a.id);
            } catch (e: any) { Alert.alert('Failed', e?.message ?? ''); }
          },
        })),
      ],
    );
  };

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Accounts</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AddAccount', {})} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {grouped.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🏦</Text>
            <Text style={styles.emptyText}>No accounts yet</Text>
            <Text style={styles.emptyHint}>Create one to start tracking balances.</Text>
          </View>
        )}

        {grouped.map(([cur, list]) => {
          const total = list.reduce((s, a) => s + (balances.get(a.id) ?? 0), 0);
          return (
            <View key={cur} style={{ marginBottom: Theme.spacing.lg }}>
              <View style={styles.groupHeader}>
                <Text style={styles.groupTitle}>{cur}</Text>
                <Text style={styles.groupTotal}>{formatCurrency(total, cur)}</Text>
              </View>
              {list.map(a => {
                const bal = balances.get(a.id) ?? 0;
                return (
                  <TouchableOpacity
                    key={a.id}
                    style={styles.card}
                    onPress={() => navigation.navigate('AddAccount', { account: a })}
                    onLongPress={() => handleDelete(a)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.icon, { backgroundColor: a.color + '22' }]}>
                      <Text style={styles.iconEmoji}>{a.emoji}</Text>
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardName}>{a.name}</Text>
                      <Text style={styles.cardMeta}>{a.bank || '—'} · {txCount(a.id)} tx</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.cardBalance, { color: bal < 0 ? Colors.expense : Colors.textPrimary }]}>{formatCurrency(bal, a.currency)}</Text>
                      <Text style={styles.cardSub}>opening {formatCurrency(a.openingBalance, a.currency)}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}

        <Text style={styles.footer}>Tap to edit · Long-press to delete</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Theme.spacing.md, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { width: 60 },
  backArrow: { fontSize: 22, color: Colors.textPrimary, fontWeight: '500' },
  title: { fontSize: Theme.fontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  addBtn: { width: 60, alignItems: 'flex-end' },
  addBtnText: { color: Colors.primary, fontWeight: '700' },
  content: { padding: Theme.spacing.lg, paddingBottom: 40 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 8 },
  emptyText: { fontSize: Theme.fontSize.md, fontWeight: '700', color: Colors.textPrimary },
  emptyHint: { fontSize: Theme.fontSize.sm, color: Colors.textTertiary, marginTop: 4 },
  groupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  groupTitle: { fontSize: Theme.fontSize.sm, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 0.5 },
  groupTotal: { fontSize: Theme.fontSize.sm, fontWeight: '700', color: Colors.textPrimary },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, padding: Theme.spacing.md, borderRadius: Theme.radius.lg, marginBottom: 8, ...Theme.shadow.card },
  icon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: Theme.spacing.md },
  iconEmoji: { fontSize: 22 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: Theme.fontSize.md, fontWeight: '700', color: Colors.textPrimary },
  cardMeta: { fontSize: Theme.fontSize.xs, color: Colors.textTertiary, marginTop: 2 },
  cardBalance: { fontSize: Theme.fontSize.md, fontWeight: '700' },
  cardSub: { fontSize: Theme.fontSize.xs, color: Colors.textTertiary, marginTop: 2 },
  footer: { textAlign: 'center', color: Colors.textTertiary, fontSize: Theme.fontSize.xs, marginTop: Theme.spacing.md },
});
