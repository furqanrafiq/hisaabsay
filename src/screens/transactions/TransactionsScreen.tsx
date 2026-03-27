import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';
import { useFinance } from '@/context/FinanceContext';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { TransactionItem } from '@/components/transactions/TransactionItem';
import { EmptyState } from '@/components/common/EmptyState';
import { Transaction } from '@/types';
import { CATEGORIES } from '@/constants/categories';
import { formatDisplayDate, getMonthKey } from '@/utils/formatDate';
import { formatCurrency } from '@/utils/formatCurrency';
import { format, subMonths } from 'date-fns';

type Filter = 'all' | 'income' | 'expense';

// Build a list of recent months for the tab bar
function getMonthTabs(count = 6) {
  const tabs = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = subMonths(now, i);
    tabs.push({ key: getMonthKey(d), label: format(d, 'MMM'), date: d });
  }
  return tabs;
}

export function TransactionsScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { transactions, customCategories } = useFinance();
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedMonthKey, setSelectedMonthKey] = useState(getMonthKey(new Date()));
  const [searchQuery, setSearchQuery] = useState('');
  const currency = user?.currency ?? 'PKR';

  const monthTabs = useMemo(() => getMonthTabs(6), []);
  const allCategories = [...CATEGORIES, ...customCategories];

  const periodFiltered = useMemo(
    () => transactions.filter((t) => t.date.startsWith(selectedMonthKey)),
    [transactions, selectedMonthKey],
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

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.title}>Transactions</Text>
      </View>

      {/* ── Month Tabs ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.monthTabs}
      >
        {monthTabs.map((tab) => {
          const active = tab.key === selectedMonthKey;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.monthTab, active && styles.monthTabActive]}
              onPress={() => setSelectedMonthKey(tab.key)}
            >
              <Text style={[styles.monthTabText, active && styles.monthTabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

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

      {/* ── Income / Expense Summary ── */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>💰 Income</Text>
          <Text style={[styles.summaryAmount, { color: Colors.income }]}>{formatCurrency(income, currency)}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>💸 Spent</Text>
          <Text style={[styles.summaryAmount, { color: Colors.expense }]}>{formatCurrency(expense, currency)}</Text>
        </View>
      </View>

      {/* ── Type Filter ── */}
      <View style={styles.filterBar}>
        {(['all', 'income', 'expense'] as Filter[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: { paddingHorizontal: Theme.spacing.lg, paddingTop: Theme.spacing.md, paddingBottom: Theme.spacing.sm },
  title: { fontSize: Theme.fontSize.xl, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.3 },

  // Month Tabs
  monthTabs: { paddingHorizontal: Theme.spacing.lg, paddingBottom: Theme.spacing.sm, paddingRight: Theme.spacing.lg },
  monthTab: { paddingHorizontal: 20, paddingVertical: 9, borderRadius: Theme.radius.full, backgroundColor: Colors.card, marginRight: 8, ...Theme.shadow.card },
  monthTabActive: { backgroundColor: Colors.primary },
  monthTabText: { fontSize: Theme.fontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  monthTabTextActive: { color: '#fff' },

  // Search
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, marginHorizontal: Theme.spacing.lg, borderRadius: Theme.radius.lg, paddingHorizontal: Theme.spacing.md, paddingVertical: 10, marginBottom: Theme.spacing.sm, ...Theme.shadow.card },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: Theme.fontSize.md, color: Colors.textPrimary, height: 24 },

  // Summary
  summaryRow: { flexDirection: 'row', backgroundColor: Colors.card, marginHorizontal: Theme.spacing.lg, borderRadius: Theme.radius.lg, padding: Theme.spacing.md, marginBottom: Theme.spacing.sm, ...Theme.shadow.card },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: Theme.fontSize.sm, color: Colors.textSecondary, fontWeight: '500', marginBottom: 4 },
  summaryAmount: { fontSize: Theme.fontSize.lg, fontWeight: '800', letterSpacing: -0.3 },
  summaryDivider: { width: 1, backgroundColor: Colors.divider, marginVertical: 4 },

  // Filter
  filterBar: { flexDirection: 'row', paddingHorizontal: Theme.spacing.lg, marginBottom: Theme.spacing.sm, gap: 8 },
  filterBtn: { flex: 1, height: 34, borderRadius: Theme.radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.card },
  filterActive: { backgroundColor: Colors.primary },
  filterText: { fontSize: Theme.fontSize.xs, color: Colors.textSecondary, fontWeight: '600' },
  filterTextActive: { color: '#fff' },

  // List
  list: { paddingHorizontal: Theme.spacing.lg, paddingBottom: 100 },
  group: { marginBottom: Theme.spacing.md },
  dateLabel: { fontSize: Theme.fontSize.sm, fontWeight: '700', color: Colors.textSecondary, marginBottom: 6 },
  groupCard: { backgroundColor: Colors.card, borderRadius: Theme.radius.lg, paddingHorizontal: Theme.spacing.md, ...Theme.shadow.card },

  // FAB
  fab: { position: 'absolute', right: Theme.spacing.lg, bottom: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', ...Theme.shadow.elevated },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300', marginTop: -2 },
});
