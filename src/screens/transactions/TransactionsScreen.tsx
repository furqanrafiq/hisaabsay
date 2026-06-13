import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useFinance } from '@/context/FinanceContext';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { TransactionItem } from '@/components/transactions/TransactionItem';
import { EmptyState } from '@/components/common/EmptyState';
import { AccountSwitcher } from '@/components/common/AccountSwitcher';
import { Transaction } from '@/types';
import { CATEGORIES } from '@/constants/categories';
import { formatDisplayDate, getMonthKey } from '@/utils/formatDate';
import { formatCurrency } from '@/utils/formatCurrency';
import { format } from 'date-fns';
import Svg, { Rect, Line } from 'react-native-svg';

type Filter = 'all' | 'income' | 'expense';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function CalendarIcon({ size = 20, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Line x1="3" y1="9" x2="21" y2="9" stroke={color} strokeWidth="2" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function MonthPickerModal({
  visible,
  selectedMonthKey,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selectedMonthKey: string;
  onSelect: (key: string) => void;
  onClose: () => void;
}) {
  const selYear = parseInt(selectedMonthKey.split('-')[0]);
  const selMonth = parseInt(selectedMonthKey.split('-')[1]) - 1;
  const [viewYear, setViewYear] = useState(selYear);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={pickerStyles.overlay} onPress={onClose}>
        <Pressable style={pickerStyles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={pickerStyles.yearRow}>
            <TouchableOpacity onPress={() => setViewYear((y) => y - 1)} style={pickerStyles.arrowBtn} activeOpacity={0.7}>
              <Text style={pickerStyles.arrow}>‹</Text>
            </TouchableOpacity>
            <Text style={pickerStyles.yearText}>{viewYear}</Text>
            <TouchableOpacity onPress={() => setViewYear((y) => y + 1)} style={pickerStyles.arrowBtn} activeOpacity={0.7}>
              <Text style={pickerStyles.arrow}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={pickerStyles.grid}>
            {MONTHS.map((label, idx) => {
              const key = `${viewYear}-${String(idx + 1).padStart(2, '0')}`;
              const active = viewYear === selYear && idx === selMonth;
              return (
                <TouchableOpacity
                  key={key}
                  style={[pickerStyles.monthBtn, active && pickerStyles.monthBtnActive]}
                  onPress={() => { onSelect(key); onClose(); }}
                  activeOpacity={0.75}
                >
                  <Text style={[pickerStyles.monthText, active && pickerStyles.monthTextActive]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function TransactionsScreen() {
  const navigation = useNavigation<any>();
  const {
    transactions, customCategories,
    currencies, accounts,
    activeCurrency, setActiveCurrency,
    activeAccountId, setActiveAccountId,
  } = useFinance();
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedMonthKey, setSelectedMonthKey] = useState(getMonthKey(new Date()));
  const [searchQuery, setSearchQuery] = useState('');
  const [calendarVisible, setCalendarVisible] = useState(false);
  const currency = activeCurrency;

  const allCategories = [...CATEGORIES, ...customCategories];

  const periodFiltered = useMemo(
    () => transactions.filter((t) =>
      (activeAccountId ? t.accountId === activeAccountId : t.currency === currency)
      && t.date.startsWith(selectedMonthKey),
    ),
    [transactions, selectedMonthKey, currency, activeAccountId],
  );

  const income = useMemo(() => periodFiltered.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0), [periodFiltered]);
  const expense = useMemo(() => periodFiltered.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0), [periodFiltered]);

  const typeFiltered = useMemo(
    () => periodFiltered.filter((t) => filter === 'all' || t.type === filter),
    [periodFiltered, filter],
  );

  const searchFiltered = useMemo(() => {
    if (!searchQuery.trim()) return typeFiltered;
    const q = searchQuery.toLowerCase();
    return typeFiltered.filter((t) => {
      const cat = allCategories.find((c) => c.id === t.category);
      return t.note.toLowerCase().includes(q) || (cat?.name.toLowerCase().includes(q) ?? false);
    });
  }, [typeFiltered, searchQuery, allCategories]);

  const grouped: { date: string; data: Transaction[] }[] = useMemo(() => {
    const groups: { date: string; data: Transaction[] }[] = [];
    searchFiltered.forEach((t) => {
      const label = formatDisplayDate(t.date);
      const existing = groups.find((g) => g.date === label);
      if (existing) existing.data.push(t);
      else groups.push({ date: label, data: [t] });
    });
    return groups;
  }, [searchFiltered]);

  const selectedLabel = format(new Date(selectedMonthKey + '-01'), 'MMM yyyy');

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.title}>Transactions</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.calendarBtn} onPress={() => setCalendarVisible(true)} activeOpacity={0.8}>
            <CalendarIcon size={16} color={Colors.primary} />
            <Text style={styles.calendarLabel}>{selectedLabel}</Text>
          </TouchableOpacity>
          <AccountSwitcher
            currencies={currencies}
            accounts={accounts}
            activeCurrency={activeCurrency}
            activeAccountId={activeAccountId}
            onSelect={(cur, id) => { setActiveCurrency(cur); setActiveAccountId(id); }}
            onManage={() => navigation.navigate('Accounts')}
          />
        </View>
      </View>

      {/* ── Search ── */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search transactions..."
          placeholderTextColor={Colors.textTertiary}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={{ color: Colors.textTertiary, fontSize: 16 }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Summary + Segmented Filter ── */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <TouchableOpacity
            style={[styles.summaryItem, filter === 'income' && styles.summaryItemActive]}
            onPress={() => setFilter(filter === 'income' ? 'all' : 'income')}
            activeOpacity={0.85}
          >
            <Text style={styles.summaryLabel}>💰 Income</Text>
            <Text style={[styles.summaryAmount, { color: Colors.income }]}>{formatCurrency(income, currency)}</Text>
          </TouchableOpacity>
          <View style={styles.summaryDivider} />
          <TouchableOpacity
            style={[styles.summaryItem, filter === 'expense' && styles.summaryItemActive]}
            onPress={() => setFilter(filter === 'expense' ? 'all' : 'expense')}
            activeOpacity={0.85}
          >
            <Text style={styles.summaryLabel}>💸 Spent</Text>
            <Text style={[styles.summaryAmount, { color: Colors.expense }]}>{formatCurrency(expense, currency)}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.segmented}>
          {(['all', 'income', 'expense'] as Filter[]).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.segment, filter === f && styles.segmentActive]}
              onPress={() => setFilter(f)}
              activeOpacity={0.85}
            >
              <Text style={[styles.segmentText, filter === f && styles.segmentTextActive]}>
                {f === 'all' ? 'All' : f === 'income' ? 'Income' : 'Expense'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={grouped}
        keyExtractor={(g) => g.date}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <EmptyState
            title={searchQuery ? 'No results found' : 'No transactions'}
            subtitle={searchQuery ? 'Try a different search term' : 'No transactions this month'}
          />
        }
        renderItem={({ item: group }) => (
          <View style={styles.group}>
            <Text style={styles.dateLabel}>{group.date}</Text>
            <View style={styles.groupCard}>
              {group.data.map((t) => (
                <TransactionItem
                  key={t.id}
                  item={t}
                  currency={currency}
                  extraCategories={customCategories}
                  onPress={() => navigation.navigate('EditTransaction', { transaction: t })}
                />
              ))}
            </View>
          </View>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddTransaction')} activeOpacity={0.85}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <MonthPickerModal
        visible={calendarVisible}
        selectedMonthKey={selectedMonthKey}
        onSelect={setSelectedMonthKey}
        onClose={() => setCalendarVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.lg, paddingTop: Theme.spacing.md, paddingBottom: Theme.spacing.sm,
    gap: Theme.spacing.sm,
  },
  title: { fontSize: Theme.fontSize.xl, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.3 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.sm },
  calendarBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: Theme.radius.full,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.primaryMuted,
    ...Theme.shadow.card,
  },
  calendarLabel: { fontSize: Theme.fontSize.xs, fontWeight: '700', color: Colors.primary, letterSpacing: 0.2 },

  // Search
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, marginHorizontal: Theme.spacing.lg, borderRadius: Theme.radius.lg, paddingHorizontal: Theme.spacing.md, paddingVertical: 10, marginBottom: Theme.spacing.sm, ...Theme.shadow.card },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: Theme.fontSize.md, color: Colors.textPrimary, height: 24 },

  // Summary card
  summaryCard: { backgroundColor: Colors.card, marginHorizontal: Theme.spacing.lg, borderRadius: Theme.radius.lg, padding: Theme.spacing.md, marginBottom: Theme.spacing.sm, gap: Theme.spacing.md, ...Theme.shadow.card },
  summaryRow: { flexDirection: 'row' },
  summaryItem: { flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: Theme.radius.md, borderWidth: 1.5, borderColor: 'transparent' },
  summaryItemActive: { borderColor: Colors.primaryMuted, backgroundColor: Colors.cardSubtle },
  summaryLabel: { fontSize: Theme.fontSize.sm, color: Colors.textSecondary, fontWeight: '500', marginBottom: 4 },
  summaryAmount: { fontSize: Theme.fontSize.lg, fontWeight: '800', letterSpacing: -0.3 },
  summaryDivider: { width: 1, backgroundColor: Colors.divider, marginVertical: 4 },

  // Segmented filter
  segmented: { flexDirection: 'row', backgroundColor: Colors.cardSubtle, borderRadius: Theme.radius.full, padding: 4 },
  segment: { flex: 1, height: 30, borderRadius: Theme.radius.full, alignItems: 'center', justifyContent: 'center' },
  segmentActive: { backgroundColor: Colors.card, ...Theme.shadow.card },
  segmentText: { fontSize: Theme.fontSize.xs, color: Colors.textSecondary, fontWeight: '700', letterSpacing: 0.3 },
  segmentTextActive: { color: Colors.primary },

  // List
  list: { paddingHorizontal: Theme.spacing.lg, paddingBottom: 100 },
  group: { marginBottom: Theme.spacing.md },
  dateLabel: { fontSize: Theme.fontSize.sm, fontWeight: '700', color: Colors.textSecondary, marginBottom: 6 },
  groupCard: { backgroundColor: Colors.card, borderRadius: Theme.radius.lg, paddingHorizontal: Theme.spacing.md, ...Theme.shadow.card },

  // FAB
  fab: { position: 'absolute', right: Theme.spacing.lg, bottom: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', ...Theme.shadow.elevated },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300', marginTop: -2 },
});

const pickerStyles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
  sheet: {
    backgroundColor: Colors.card, borderRadius: Theme.radius.xl,
    padding: Theme.spacing.lg, width: 300,
    ...Theme.shadow.elevated,
  },
  yearRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: Theme.spacing.md,
  },
  arrowBtn: { padding: 8 },
  arrow: { fontSize: 24, color: Colors.textPrimary, fontWeight: '300', lineHeight: 28 },
  yearText: { fontSize: Theme.fontSize.lg, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.3 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  monthBtn: {
    width: '30%', paddingVertical: 10, borderRadius: Theme.radius.lg,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.cardSubtle,
    flexGrow: 1,
  },
  monthBtnActive: { backgroundColor: Colors.primary },
  monthText: { fontSize: Theme.fontSize.sm, fontWeight: '600', color: Colors.textPrimary },
  monthTextActive: { color: '#fff', fontWeight: '700' },
});
