import { saveData, loadData, removeData, STORAGE_KEYS } from './storage';
import { UserProfile } from '@/types';

export async function mockSendOTP(contact: string): Promise<void> {
  // In real app: call backend API to send OTP
  console.log(`OTP sent to ${contact}`);
  await new Promise((r) => setTimeout(r, 800));
}

export async function mockVerifyOTP(contact: string, otp: string): Promise<UserProfile> {
  await new Promise((r) => setTimeout(r, 600));
  if (otp.length !== 6) throw new Error('Invalid OTP');
  const existing = await loadData<UserProfile>(STORAGE_KEYS.PROFILE);
  if (existing) return existing;
  const newProfile: UserProfile = {
    name: '',
    phone: contact,
    currency: 'PKR',
    notificationsEnabled: true,
  };
  await saveData(STORAGE_KEYS.PROFILE, newProfile);
  return newProfile;
}

export async function saveSession(phone: string) {
  await saveData(STORAGE_KEYS.SESSION, { phone, timestamp: Date.now() });
}

export async function loadSession(): Promise<string | null> {
  const data = await loadData<{ phone: string; timestamp: number }>(STORAGE_KEYS.SESSION);
  return data?.phone ?? null;
}

export async function clearSession() {
  await removeData(STORAGE_KEYS.SESSION);
}
