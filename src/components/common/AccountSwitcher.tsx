import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, ScrollView } from 'react-native';
import { Account, Currency } from '@/types';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';

interface Props {
  currencies: Currency[];
  accounts: Account[];
  activeCurrency: string;
  activeAccountId: string | null;
  onSelect: (currency: string, accountId: string | null) => void;
  onManage?: () => void;
}

export function AccountSwitcher({
  currencies, accounts, activeCurrency, activeAccountId, onSelect, onManage,
}: Props) {
  const [open, setOpen] = useState(false);
  const activeAccount = accounts.find((a) => a.id === activeAccountId);
  const activeCur = currencies.find((c) => c.code === activeCurrency);

  const grouped = useMemo(() => {
    const by: Record<string, Account[]> = {};
    for (const a of accounts) {
      if (a.archived) continue;
      (by[a.currency] ||= []).push(a);
    }
    return currencies
      .map((c) => ({ currency: c, accounts: by[c.code] ?? [] }))
      .filter((g) => g.accounts.length > 0 || g.currency.code === activeCurrency);
  }, [accounts, currencies, activeCurrency]);

  const pillLabel = activeAccount
    ? `${activeAccount.emoji} ${activeAccount.name} · ${activeAccount.currency}`
    : `💼 All ${activeCur?.code ?? activeCurrency}`;

  return (
    <>
      <TouchableOpacity style={styles.pill} onPress={() => setOpen(true)} activeOpacity={0.85}>
        <Text style={styles.pillText} numberOfLines={1}>{pillLabel}</Text>
        <Text style={styles.pillChevron}>▾</Text>
      </TouchableOpacity>

      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.handle} />
            <Text style={styles.title}>Choose Wallet</Text>
            <Text style={styles.subtitle}>Dashboards will scope to this selection</Text>

            <ScrollView style={{ maxHeight: 460 }} contentContainerStyle={{ gap: 16 }}>
              {grouped.map((g) => {
                const isAllActive = !activeAccountId && activeCurrency === g.currency.code;
                return (
                  <View key={g.currency.code}>
                    <View style={styles.groupHeader}>
                      <Text style={styles.groupTitle}>{g.currency.code} · {g.currency.name}</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.row, isAllActive && styles.rowActive]}
                      onPress={() => { onSelect(g.currency.code, null); setOpen(false); }}
                      activeOpacity={0.85}
                    >
                      <View style={styles.rowLeft}>
                        <Text style={styles.rowSymbol}>💼</Text>
                        <View>
                          <Text style={styles.rowName}>All {g.currency.code}</Text>
                          <Text style={styles.rowMeta}>Aggregate of {g.accounts.length} account(s)</Text>
                        </View>
                      </View>
                      {isAllActive && <Text style={styles.check}>✓</Text>}
                    </TouchableOpacity>

                    {g.accounts.map((a) => {
                      const isActive = activeAccountId === a.id;
                      return (
                        <TouchableOpacity
                          key={a.id}
                          style={[styles.row, isActive && styles.rowActive]}
                          onPress={() => { onSelect(a.currency, a.id); setOpen(false); }}
                          activeOpacity={0.85}
                        >
                          <View style={styles.rowLeft}>
                            <Text style={[styles.rowSymbol, { backgroundColor: a.color + '22' }]}>{a.emoji}</Text>
                            <View>
                              <Text style={styles.rowName}>{a.name}</Text>
                              <Text style={styles.rowMeta}>{a.bank || '—'}</Text>
                            </View>
                          </View>
                          {isActive && <Text style={styles.check}>✓</Text>}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                );
              })}
            </ScrollView>

            {onManage && (
              <TouchableOpacity style={styles.manage} onPress={() => { setOpen(false); onManage(); }}>
                <Text style={styles.manageText}>🏦 Manage Accounts →</Text>
              </TouchableOpacity>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', maxWidth: '95%',
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: Theme.radius.full, backgroundColor: Colors.card,
    marginBottom: 10, ...Theme.shadow.card,
  },
  pillText: { fontSize: Theme.fontSize.sm, fontWeight: '700', color: Colors.textPrimary, letterSpacing: 0.3 },
  pillChevron: { fontSize: 12, color: Colors.textTertiary, marginLeft: 2 },

  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.background, borderTopLeftRadius: Theme.radius.xl, borderTopRightRadius: Theme.radius.xl,
    padding: Theme.spacing.lg, paddingBottom: 32,
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, marginBottom: Theme.spacing.md },
  title: { fontSize: Theme.fontSize.lg, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.3 },
  subtitle: { fontSize: Theme.fontSize.xs, color: Colors.textTertiary, marginTop: 2, marginBottom: Theme.spacing.md },

  groupHeader: { marginBottom: 6 },
  groupTitle: { fontSize: Theme.fontSize.xs, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 0.5, textTransform: 'uppercase' },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Theme.spacing.md, borderRadius: Theme.radius.lg, marginTop: 6,
    backgroundColor: Colors.card, borderWidth: 1.5, borderColor: 'transparent',
  },
  rowActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  rowSymbol: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.cardSubtle,
    textAlign: 'center', textAlignVertical: 'center', lineHeight: 40,
    fontSize: 18, fontWeight: '800', color: Colors.textPrimary,
  },
  rowName: { fontSize: Theme.fontSize.md, fontWeight: '700', color: Colors.textPrimary },
  rowMeta: { fontSize: Theme.fontSize.xs, color: Colors.textTertiary, marginTop: 1 },
  check: { fontSize: 18, color: Colors.primary, fontWeight: '800' },

  manage: { marginTop: Theme.spacing.md, padding: Theme.spacing.md, alignItems: 'center', borderRadius: Theme.radius.lg, backgroundColor: Colors.cardSubtle },
  manageText: { fontSize: Theme.fontSize.sm, fontWeight: '700', color: Colors.primary },
});
