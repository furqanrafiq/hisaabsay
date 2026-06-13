import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Currency } from '@/types';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';

interface Props {
  currencies: Currency[];
  activeCurrency: string;
  onChange: (code: string) => void;
}

export function CurrencySwitcher({ currencies, activeCurrency, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const active = currencies.find((c) => c.code === activeCurrency);

  return (
    <>
      <TouchableOpacity style={styles.pill} onPress={() => setOpen(true)} activeOpacity={0.85}>
        <Text style={styles.pillEmoji}>💼</Text>
        <Text style={styles.pillText}>{active?.code ?? activeCurrency}</Text>
        <Text style={styles.pillChevron}>▾</Text>
      </TouchableOpacity>

      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.handle} />
            <Text style={styles.title}>Choose Wallet</Text>
            <Text style={styles.subtitle}>Dashboards will switch to this currency</Text>

            <View style={styles.list}>
              {currencies.map((c) => {
                const isActive = c.code === activeCurrency;
                return (
                  <TouchableOpacity
                    key={c.code}
                    style={[styles.row, isActive && styles.rowActive]}
                    onPress={() => { onChange(c.code); setOpen(false); }}
                    activeOpacity={0.85}
                  >
                    <View style={styles.rowLeft}>
                      <Text style={styles.rowSymbol}>{c.symbol || c.code}</Text>
                      <View>
                        <Text style={styles.rowCode}>{c.code}</Text>
                        <Text style={styles.rowName}>{c.name}</Text>
                      </View>
                    </View>
                    {isActive && <Text style={styles.check}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: Theme.radius.full, backgroundColor: Colors.card,
    marginBottom: 10,
    ...Theme.shadow.card,
  },
  pillEmoji: { fontSize: 14 },
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

  list: { gap: 8 },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Theme.spacing.md, borderRadius: Theme.radius.lg,
    backgroundColor: Colors.card, borderWidth: 1.5, borderColor: 'transparent',
  },
  rowActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowSymbol: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.cardSubtle,
    textAlign: 'center', textAlignVertical: 'center', lineHeight: 40,
    fontSize: 14, fontWeight: '800', color: Colors.textPrimary,
  },
  rowCode: { fontSize: Theme.fontSize.md, fontWeight: '700', color: Colors.textPrimary, letterSpacing: 0.3 },
  rowName: { fontSize: Theme.fontSize.xs, color: Colors.textTertiary, marginTop: 1 },
  check: { fontSize: 18, color: Colors.primary, fontWeight: '800' },
});
