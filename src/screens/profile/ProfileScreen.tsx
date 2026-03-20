import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity,
  Alert, Modal, TextInput, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useFinance } from '@/context/FinanceContext';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { CURRENCIES, formatCurrency } from '@/utils/formatCurrency';
import { getCategoryById } from '@/constants/categories';
import { getMonthKey, formatMonthYear } from '@/utils/formatDate';
import { getMonthlyTotals } from '@/utils/calculations';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

type RowProps = {
  emoji: string;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
};

function SettingsRow({ emoji, label, subtitle, onPress, rightElement, showChevron = true }: RowProps) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={onPress ? 0.6 : 1} disabled={!onPress && !rightElement}>
      <View style={styles.rowIcon}>
        <Text style={styles.rowEmoji}>{emoji}</Text>
      </View>
      <View style={styles.rowContent}>
        <Text style={styles.rowLabel}>{label}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      {rightElement
        ? <View>{rightElement}</View>
        : showChevron
          ? <Text style={styles.chevron}>›</Text>
          : null}
    </TouchableOpacity>
  );
}

export function ProfileScreen() {
  const { user, updateProfile, logout } = useAuth();
  const { transactions, goals } = useFinance();

  const [name, setName] = useState(user?.name ?? '');
  const [currency, setCurrency] = useState(user?.currency ?? 'PKR');
  const [notifications, setNotifications] = useState(user?.notificationsEnabled ?? true);
  const [exporting, setExporting] = useState(false);

  const [editNameVisible, setEditNameVisible] = useState(false);
  const [tempName, setTempName] = useState(name);
  const [currencyVisible, setCurrencyVisible] = useState(false);

  const handleSaveName = async () => {
    const trimmed = tempName.trim();
    if (!trimmed) return;
    setName(trimmed);
    setEditNameVisible(false);
    await updateProfile({ name: trimmed, currency, notificationsEnabled: notifications });
  };

  const handleSelectCurrency = async (c: string) => {
    setCurrency(c);
    setCurrencyVisible(false);
    await updateProfile({ name, currency: c, notificationsEnabled: notifications });
  };

  const handleToggleNotifications = async (val: boolean) => {
    setNotifications(val);
    await updateProfile({ name, currency, notificationsEnabled: val });
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const now = new Date();
      const monthKey = getMonthKey(now);
      const { income, expense, balance } = getMonthlyTotals(transactions, monthKey);

      const txRows = transactions
        .filter((t) => t.date.startsWith(monthKey))
        .map((t) => {
          const cat = getCategoryById(t.category);
          const sign = t.type === 'income' ? '+' : '-';
          const color = t.type === 'income' ? '#16A34A' : '#DC2626';
          return `<tr>
            <td>${t.date}</td>
            <td>${cat.name}</td>
            <td>${t.note || '-'}</td>
            <td style="color:${color};font-weight:700">${sign}${formatCurrency(t.amount, currency)}</td>
          </tr>`;
        }).join('');

      const goalRows = goals.map((g) => {
        const pct = g.targetAmount > 0 ? Math.round((g.savedAmount / g.targetAmount) * 100) : 0;
        return `<tr>
          <td>${g.emoji} ${g.name}</td>
          <td>${formatCurrency(g.savedAmount, currency)}</td>
          <td>${formatCurrency(g.targetAmount, currency)}</td>
          <td>${pct}%</td>
        </tr>`;
      }).join('');

      const html = `
        <html><head><style>
          body { font-family: -apple-system, sans-serif; padding: 32px; color: #0F172A; }
          h1 { color: #1E293B; font-size: 24px; margin-bottom: 4px; }
          h2 { color: #1E293B; font-size: 16px; margin-top: 32px; margin-bottom: 12px; border-bottom: 2px solid #E2E8F0; padding-bottom: 6px; }
          .sub { color: #64748B; font-size: 13px; margin-bottom: 24px; }
          .summary { display: flex; gap: 16px; margin-bottom: 8px; }
          .card { background: #F1F5F9; border-radius: 12px; padding: 16px 24px; flex: 1; }
          .card-label { font-size: 11px; color: #64748B; text-transform: uppercase; letter-spacing: 1px; }
          .card-value { font-size: 22px; font-weight: 800; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          th { background: #F1F5F9; padding: 8px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748B; }
          td { padding: 8px 12px; border-bottom: 1px solid #F1F5F9; }
        </style></head><body>
          <h1>HisaabSay Report</h1>
          <div class="sub">${name} &nbsp;·&nbsp; ${formatMonthYear(now)}</div>
          <div class="summary">
            <div class="card"><div class="card-label">Income</div><div class="card-value" style="color:#16A34A">${formatCurrency(income, currency)}</div></div>
            <div class="card"><div class="card-label">Expenses</div><div class="card-value" style="color:#DC2626">${formatCurrency(expense, currency)}</div></div>
            <div class="card"><div class="card-label">Balance</div><div class="card-value">${formatCurrency(balance, currency)}</div></div>
          </div>
          <h2>Transactions</h2>
          <table><thead><tr><th>Date</th><th>Category</th><th>Note</th><th>Amount</th></tr></thead>
          <tbody>${txRows || '<tr><td colspan="4" style="color:#94A3B8;text-align:center">No transactions this month</td></tr>'}</tbody></table>
          ${goals.length > 0 ? `<h2>Savings Goals</h2>
          <table><thead><tr><th>Goal</th><th>Saved</th><th>Target</th><th>Progress</th></tr></thead>
          <tbody>${goalRows}</tbody></table>` : ''}
        </body></html>`;

      const { uri } = await Print.printToFileAsync({ html, base64: false });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Export Report' });
    } catch {
      Alert.alert('Export Failed', 'Could not generate PDF.');
    } finally {
      setExporting(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.avatarWrapper}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{name?.[0]?.toUpperCase() || '?'}</Text>
          </View>
          <Text style={styles.displayName}>{name || 'Your Name'}</Text>
        </View>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>

        {/* ── Account ── */}
        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.sectionCard}>
          <SettingsRow
            emoji="✏️"
            label="Edit Name"
            onPress={() => { setTempName(name); setEditNameVisible(true); }}
          />
          <View style={styles.divider} />
          <SettingsRow
            emoji="📱"
            label={`Phone: ${user?.phone || '-'}`}
            showChevron={false}
          />
          <View style={styles.divider} />
          <SettingsRow
            emoji="💱"
            label={`Default Currency: ${currency}`}
            onPress={() => setCurrencyVisible(true)}
          />
        </View>

        {/* ── Preferences ── */}
        <Text style={styles.sectionLabel}>Preferences</Text>
        <View style={styles.sectionCard}>
          <SettingsRow
            emoji="🔔"
            label="Notifications"
            rightElement={
              <Switch
                value={notifications}
                onValueChange={handleToggleNotifications}
                trackColor={{ true: Colors.primary, false: Colors.border }}
                thumbColor={Colors.card}
              />
            }
          />
          <View style={styles.divider} />
          <SettingsRow
            emoji="🌙"
            label="Dark Mode"
            onPress={() => Alert.alert('Coming Soon', 'Dark mode will be available in a future update.')}
          />
          <View style={styles.divider} />
          <SettingsRow
            emoji="📊"
            label={exporting ? 'Exporting…' : 'Export Data (PDF / Excel)'}
            onPress={exporting ? undefined : handleExportPDF}
          />
        </View>

        {/* ── Security ── */}
        <Text style={styles.sectionLabel}>Security</Text>
        <View style={styles.sectionCard}>
          <SettingsRow
            emoji="☁️"
            label="Cloud Backup & Sync"
            onPress={() => Alert.alert('Coming Soon', 'Cloud backup will be available in a future update.')}
          />
          <View style={styles.divider} />
          <SettingsRow
            emoji="🔐"
            label="Session Management"
            subtitle="HisaabSay v1.0.0 (MVP)"
            onPress={handleLogout}
          />
        </View>

        {/* ── Logout ── */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
          <Text style={styles.logoutEmoji}>🚪</Text>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* ── Edit Name Modal ── */}
      <Modal visible={editNameVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Name</Text>
            <TextInput
              style={styles.modalInput}
              value={tempName}
              onChangeText={setTempName}
              placeholder="Your name"
              placeholderTextColor={Colors.textTertiary}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setEditNameVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleSaveName}>
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Currency Modal ── */}
      <Modal visible={currencyVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Currency</Text>
            {CURRENCIES.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.currencyOption, currency === c && styles.currencyOptionActive]}
                onPress={() => handleSelectCurrency(c)}
              >
                <Text style={[styles.currencyOptionText, currency === c && styles.currencyOptionTextActive]}>{c}</Text>
                {currency === c && <Text style={{ fontSize: 16 }}>✅</Text>}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalCancel} onPress={() => setCurrencyVisible(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: Theme.spacing.md,
    paddingBottom: Theme.spacing.xl,
    alignItems: 'center',
  },
  headerTitle: {
    alignSelf: 'flex-start',
    color: Colors.textOnPrimary,
    fontSize: Theme.fontSize.xl,
    fontWeight: Theme.fontWeight.bold,
    marginBottom: Theme.spacing.lg,
  },
  avatarWrapper: { alignItems: 'center' },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6B7280',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Theme.spacing.sm,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: Theme.fontSize.xxl,
    fontWeight: Theme.fontWeight.bold,
  },
  displayName: {
    color: Colors.textOnPrimary,
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.semibold,
  },

  // Body
  body: { flex: 1 },
  bodyContent: { paddingTop: Theme.spacing.md, paddingBottom: 40 },

  sectionLabel: {
    fontSize: Theme.fontSize.xs,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.textSecondary,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginHorizontal: Theme.spacing.lg,
    marginBottom: Theme.spacing.xs,
    marginTop: Theme.spacing.md,
  },
  sectionCard: {
    backgroundColor: Colors.card,
    marginHorizontal: Theme.spacing.lg,
    borderRadius: Theme.radius.md,
    overflow: 'hidden',
    ...Theme.shadow.card,
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: 14,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: Theme.radius.sm,
    backgroundColor: Colors.cardSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.md,
  },
  rowEmoji: {
    fontSize: 18,
  },
  chevron: {
    fontSize: 22,
    color: Colors.textTertiary,
    lineHeight: 24,
  },
  rowContent: { flex: 1 },
  rowLabel: {
    fontSize: Theme.fontSize.md,
    color: Colors.textPrimary,
    fontWeight: Theme.fontWeight.medium,
  },
  rowSubtitle: {
    fontSize: Theme.fontSize.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginLeft: Theme.spacing.md + 34 + Theme.spacing.md,
  },

  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: Theme.spacing.xl,
    marginHorizontal: Theme.spacing.lg,
    paddingVertical: 14,
    borderRadius: Theme.radius.md,
    borderWidth: 1.5,
    borderColor: Colors.expense,
    backgroundColor: '#FEF2F2',
  },
  logoutEmoji: {
    fontSize: 18,
  },
  logoutText: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.expense,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.lg,
  },
  modalCard: {
    backgroundColor: Colors.card,
    borderRadius: Theme.radius.lg,
    padding: Theme.spacing.lg,
    width: '100%',
    maxWidth: 360,
  },
  modalTitle: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Theme.spacing.md,
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Theme.radius.md,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    fontSize: Theme.fontSize.md,
    color: Colors.textPrimary,
    marginBottom: Theme.spacing.md,
  },
  modalActions: { flexDirection: 'row', gap: Theme.spacing.sm },
  modalCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Theme.radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    marginTop: Theme.spacing.sm,
  },
  modalCancelText: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.medium,
    color: Colors.textSecondary,
  },
  modalSave: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Theme.radius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.semibold,
    color: Colors.textOnPrimary,
  },

  // Currency options
  currencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: Theme.spacing.sm,
    borderRadius: Theme.radius.md,
    marginBottom: 4,
  },
  currencyOptionActive: { backgroundColor: Colors.primaryMuted },
  currencyOptionText: {
    fontSize: Theme.fontSize.md,
    color: Colors.textPrimary,
    fontWeight: Theme.fontWeight.medium,
  },
  currencyOptionTextActive: {
    color: Colors.primary,
    fontWeight: Theme.fontWeight.bold,
  },
});
