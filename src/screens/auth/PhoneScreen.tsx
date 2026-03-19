import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppInput } from '@/components/common/AppInput';
import { AppButton } from '@/components/common/AppButton';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';

type Props = { navigation: NativeStackNavigationProp<any> };

export function PhoneScreen({ navigation }: Props) {
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { sendOTP, logout } = useAuth();

  useEffect(() => { logout(); }, []);

  const handleSend = async () => {
    if (contact.trim().length < 5) { setError('Enter a valid phone or email'); return; }
    setError('');
    setLoading(true);
    try {
      await sendOTP(contact.trim());
      navigation.navigate('OTP', { contact: contact.trim() });
    } catch {
      setError('Failed to send OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.logoArea}>
          <Text style={styles.logo}>💰</Text>
          <Text style={styles.appName}>HisaabSay</Text>
          <Text style={styles.tagline}>Your personal finance companion</Text>
        </View>
        <View style={styles.form}>
          <Text style={styles.heading}>Get Started</Text>
          <Text style={styles.sub}>Enter your phone number or email</Text>
          <AppInput
            value={contact}
            onChangeText={setContact}
            placeholder="+92 300 0000000 or email"
            keyboardType="email-address"
            autoCapitalize="none"
            error={error}
          />
          <AppButton title="Send OTP" onPress={handleSend} loading={loading} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: { flexGrow: 1, padding: Theme.spacing.lg, justifyContent: 'center' },
  logoArea: { alignItems: 'center', marginBottom: Theme.spacing.xxl },
  logo: { fontSize: 64 },
  appName: { fontSize: Theme.fontSize.xxl, fontWeight: '700', color: Colors.primary, marginTop: Theme.spacing.sm },
  tagline: { fontSize: Theme.fontSize.sm, color: Colors.textSecondary, marginTop: 4 },
  form: { backgroundColor: Colors.card, borderRadius: Theme.radius.xl, padding: Theme.spacing.lg, ...Theme.shadow.card },
  heading: { fontSize: Theme.fontSize.xl, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  sub: { fontSize: Theme.fontSize.sm, color: Colors.textSecondary, marginBottom: Theme.spacing.lg },
});
