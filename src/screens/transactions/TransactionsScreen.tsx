import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';
import { useFinance } from '@/context/FinanceContext';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { TransactionItem } from '@/components/transactions/TransactionItem';
import { EmptyState } from '@/components/common/EmptyState';
import { Transaction } from '@/types';
import { CATEGORIES, getCategoryById } from '@/constants/categories';
import { formatDisplayDate, getMonthKey, formatMonthYear } from '@/utils/formatDate';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { addMonths, subMonths, addYears, subYears, format } from 'date-fns';

type Filter = 'all' | 'income' | 'expense';
type ViewMode = 'month' | 'year';

export function TransactionsScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { transactions, customCategories } = useFinance();
  const [filter, setFilter] = useState<Filter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);
  const currency = user?.currency ?? 'PKR';

  const allCategories = [...CATEGORIES, ...customCategories];

  const periodFiltered = useMemo(() => {
    if (viewMode === 'month') {
      const monthKey = getMonthKey(currentDate);
      return transactions.filter((t) => t.date.startsWith(monthKey));
    } else {
      const yearKey = format(currentDate, 'yyyy');
      return transactions.filter((t) => t.date.startsWith(yearKey));
    }
  }, [transactions, viewMode, currentDate]);

  const typeFiltered = useMemo(
    () => periodFiltered.filter((t) => filter === 'all' || t.type === filter),
    [periodFiltered, filter]
  );

  const searchFiltered = useMemo(() => {
    if (!searchQuery.trim()) return typeFiltered;
    const q = searchQuery.toLowerCase();
    return typeFiltered.filter((t) => {
      const cat = allCategories.find((c) => c.id === t.category);
      return (
        t.note.toLowerCase().includes(q) ||
        (cat?.name.toLowerCase().includes(q) ?? false)
      );
    });
  }, [typeFiltered, searchQuery, allCategories]);

  const grouped: { date: string; data: Transaction[] }[] = useMemo(() => {
    const groups: { date: string; data: Transaction[] }[] = [];
    searchFiltered.forEach((t) => {
      const label = viewMode === 'year' ? format(new Date(t.date), 'MMMM yyyy') : formatDisplayDate(t.date);
      const existing = groups.find((g) => g.date === label);
      if (existing) existing.data.push(t);
      else groups.push({ date: label, data: [t] });
    });
    return groups;
  }, [searchFiltered, viewMode]);

  const goBack = () => viewMode === 'month' ? setCurrentDate((d) => subMonths(d, 1)) : setCurrentDate((d) => subYears(d, 1));
  const goForward = () => viewMode === 'month' ? setCurrentDate((d) => addMonths(d, 1)) : setCurrentDate((d) => addYears(d, 1));
  const periodLabel = viewMode === 'month' ? formatMonthYear(currentDate) : format(currentDate, 'yyyy');

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* Top bar: period selector + search toggle */}
      <View style={styles.topBar}>
        <View style={styles.monthRow}>
          <TouchableOpacity onPress={goBack} style={styles.monthBtn}>
            <Text style={styles.monthArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{periodLabel}</Text>
          <TouchableOpacity onPress={goForward} style={styles.monthBtn}>
            <Text style={styles.monthArrow}>›</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.topRight}>
          {/* Month / Year toggle */}
          <View style={styles.viewToggle}>
            {(['month', 'year'] as ViewMode[]).map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.viewToggleBtn, viewMode === m && styles.viewToggleBtnActive]}
                onPress={() => setViewMode(m)}
              >
                <Text style={[styles.viewToggleText, viewMode === m && styles.viewToggleTextActive]}>
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={styles.searchIcon}
            onPress={() => { setSearchVisible((v) => !v); setSearchQuery(''); }}
          >
            <MaterialCommunityIcons
              name={searchVisible ? 'close' : 'magnify'}
              size={22}
              color={Colors.primary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search bar */}
      {searchVisible && (
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={18} color={Colors.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by note or category..."
            placeholderTextColor={Colors.textSecondary}
            autoFocus
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Filter Bar */}
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
            subtitle={searchQuery ? 'Try a different search term' : 'Try a different period or filter'}
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
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Theme.spacing.md, paddingVertical: Theme.spacing.sm, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  monthRow: { flexDirection: 'row', alignItems: 'center' },
  monthBtn: { padding: Theme.spacing.sm },
  monthArrow: { fontSize: 24, color: Colors.primary, fontWeight: '500' },
  monthLabel: { fontSize: Theme.fontSize.md, fontWeight: '600', color: Colors.textPrimary, minWidth: 110, textAlign: 'center' },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  viewToggle: { flexDirection: 'row', backgroundColor: Colors.cardMint, borderRadius: Theme.radius.full, padding: 2 },
  viewToggleBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Theme.radius.full },
  viewToggleBtnActive: { backgroundColor: Colors.primary },
  viewToggleText: { fontSize: Theme.fontSize.xs, color: Colors.textSecondary, fontWeight: '500' },
  viewToggleTextActive: { color: Colors.textOnPrimary },
  searchIcon: { padding: 4 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, paddingHorizontal: Theme.spacing.md, paddingVertical: Theme.spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  searchInput: { flex: 1, fontSize: Theme.fontSize.md, color: Colors.textPrimary, height: 36 },
  filterBar: { flexDirection: 'row', padding: Theme.spacing.sm, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  filterBtn: { flex: 1, height: 34, borderRadius: Theme.radius.full, alignItems: 'center', justifyContent: 'center' },
  filterActive: { backgroundColor: Colors.primary },
  filterText: { fontSize: Theme.fontSize.sm, color: Colors.textSecondary, fontWeight: '500' },
  filterTextActive: { color: Colors.textOnPrimary },
  list: { padding: Theme.spacing.md, paddingBottom: 100 },
  group: { marginBottom: Theme.spacing.md },
  dateLabel: { fontSize: Theme.fontSize.sm, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6 },
  groupCard: { backgroundColor: Colors.card, borderRadius: Theme.radius.lg, padding: Theme.spacing.md, ...Theme.shadow.card },
  fab: { position: 'absolute', right: Theme.spacing.lg, bottom: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', ...Theme.shadow.card },
  fabText: { color: Colors.textOnPrimary, fontSize: 28, fontWeight: '300', marginTop: -2 },
});
