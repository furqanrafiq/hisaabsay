import { apiFetch } from './api';
import { clearAuthToken, setAuthToken } from './token';
import { UserProfile } from '@/types';

export async function sendOTP(phone: string): Promise<void> {
  await apiFetch<{ message: string }>(`/auth/send-otp`, {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ phone }),
  });
}

export async function verifyOTP(phone: string, otp: string): Promise<UserProfile> {
  const res = await apiFetch<{ token: string; profile: UserProfile }>(`/auth/verify-otp`, {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ phone, otp }),
  });
  await setAuthToken(res.token);
  return res.profile;
}

export async function logout() {
  await clearAuthToken();
}
