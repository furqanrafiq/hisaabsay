import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { AppButton } from '@/components/common/AppButton';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/colors';
import { Theme } from '@/constants/theme';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<{ OTP: { contact: string } }, 'OTP'>;
};

export function OTPScreen({ navigation, route }: Props) {
  const { contact } = route.params;
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(30);
  const { verifyOTP, sendOTP } = useAuth();
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer((s) => s - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  const handleVerify = async () => {
    if (otp.length !== 6) { setError('Enter the 6-digit OTP'); return; }
    setError('');
    setLoading(true);
    try {
      await verifyOTP(contact, otp);
    } catch {
      setError('Invalid OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    await sendOTP(contact);
    setResendTimer(30);
    setOtp('');
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.heading}>Verify OTP</Text>
        <Text style={styles.sub}>Enter the 6-digit code sent to{'\n'}<Text style={styles.contact}>{contact}</Text></Text>
        <TextInput
          ref={inputRef}
          style={styles.otpInput}
          value={otp}
          onChangeText={(v) => setOtp(v.replace(/\D/g, '').slice(0, 6))}
          keyboardType="number-pad"
          maxLength={6}
          placeholder="000000"
          placeholderTextColor={Colors.textSecondary}
          letterSpacing={8}
          autoFocus
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <AppButton title="Verify" onPress={handleVerify} loading={loading} style={{ marginTop: Theme.spacing.lg }} />
        <TouchableOpacity onPress={handleResend} disabled={resendTimer > 0} style={{ marginTop: Theme.spacing.md, alignItems: 'center' }}>
          <Text style={[styles.resend, resendTimer > 0 && { color: Colors.textSecondary }]}>
            {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.hint}>Hint: Any 6-digit code works in demo mode</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, padding: Theme.spacing.lg, paddingTop: 60 },
  back: { marginBottom: Theme.spacing.lg },
  backText: { fontSize: Theme.fontSize.md, color: Colors.primary, fontWeight: '500' },
  heading: { fontSize: Theme.fontSize.xxl, fontWeight: '700', color: Colors.textPrimary },
  sub: { fontSize: Theme.fontSize.sm, color: Colors.textSecondary, marginTop: 8, marginBottom: Theme.spacing.xl, lineHeight: 20 },
  contact: { color: Colors.primary, fontWeight: '600' },
  otpInput: {
    backgroundColor: Colors.card, borderRadius: Theme.radius.lg, height: 64,
    textAlign: 'center', fontSize: 28, fontWeight: '700', color: Colors.textPrimary,
    borderWidth: 2, borderColor: Colors.primary, letterSpacing: 12,
    ...Theme.shadow.card,
  },
  error: { color: Colors.error, fontSize: Theme.fontSize.sm, textAlign: 'center', marginTop: Theme.spacing.sm },
  resend: { fontSize: Theme.fontSize.sm, color: Colors.primary, fontWeight: '500' },
  hint: { fontSize: Theme.fontSize.xs, color: Colors.textSecondary, textAlign: 'center', marginTop: Theme.spacing.xl, fontStyle: 'italic' },
});
