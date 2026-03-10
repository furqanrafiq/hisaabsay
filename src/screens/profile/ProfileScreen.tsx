import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';
import { AppInput } from '@/components/common/AppInput';
import { AppButton } from '@/components/common/AppButton';
import { AppCard } from '@/components/common/AppCard';
import { CURRENCIES } from '@/utils/formatCurrency';

export function ProfileScreen() {
  const { user, updateProfile, logout } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [currency, setCurrency] = useState(user?.currency ?? 'PKR');
  const [notifications, setNotifications] = useState(user?.notificationsEnabled ?? true);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await updateProfile({ name, currency, notificationsEnabled: notifications });
    setSaving(false);
    Alert.alert('Saved!', 'Profile updated.');
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.avatarArea}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{name?.[0]?.toUpperCase() || '?'}</Text>
        </View>
        <Text style={styles.phone}>{user?.phone}</Text>
      </View>

      <AppCard style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Info</Text>
        <AppInput label="Display Name" value={name} onChangeText={setName} placeholder="Your name" />
      </AppCard>

      <AppCard style={styles.section}>
        <Text style={styles.sectionTitle}>Currency</Text>
        <View style={styles.currencyRow}>
          {CURRENCIES.map((c) => (
            <TouchableOpacity key={c} style={[styles.currencyBtn, currency === c && styles.currencyActive]} onPress={() => setCurrency(c)}>
              <Text style={[styles.currencyText, currency === c && styles.currencyTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </AppCard>

      <AppCard style={styles.section}>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Push Notifications</Text>
          <Switch value={notifications} onValueChange={setNotifications} trackColor={{ true: Colors.primary }} />
        </View>
      </AppCard>

      <AppButton title="Save Changes" onPress={handleSave} loading={saving} style={{ marginBottom: Theme.spacing.md }} />
      <AppButton title="Logout" onPress={handleLogout} variant="ghost" />
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Theme.spacing.lg, paddingBottom: 40 },
  avatarArea: { alignItems: 'center', marginBottom: Theme.spacing.lg },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: Theme.spacing.sm },
  avatarText: { color: Colors.textOnPrimary, fontSize: Theme.fontSize.xxl, fontWeight: '700' },
  phone: { fontSize: Theme.fontSize.sm, color: Colors.textSecondary },
  section: { marginBottom: Theme.spacing.md },
  sectionTitle: { fontSize: Theme.fontSize.md, fontWeight: '700', color: Colors.textPrimary, marginBottom: Theme.spacing.md },
  currencyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  currencyBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Theme.radius.full, backgroundColor: Colors.cardMint, borderWidth: 1.5, borderColor: 'transparent' },
  currencyActive: { borderColor: Colors.primary, backgroundColor: Colors.cardMint },
  currencyText: { fontSize: Theme.fontSize.sm, color: Colors.textSecondary, fontWeight: '500' },
  currencyTextActive: { color: Colors.primary, fontWeight: '700' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchLabel: { fontSize: Theme.fontSize.md, color: Colors.textPrimary },
});
