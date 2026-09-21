// Auth service adapter.
//
// The ShaktiOS backend currently exposes NO auth endpoints (see
// shakti-os/docs/API.md — only /health, /events, /incidents, /ws/*).
// This adapter provides the real session interface with a local mock so the
// UI is not coupled to fake logic; swap `mockAuth` for real endpoints when
// the backend adds them without touching screens.
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { User } from '@/src/types';

const TOKEN_KEY = 'shaktios_session_token';
const USER_KEY = 'shaktios_session_user';

// SecureStore is unavailable on web — fall back to memory there.
const memory: Record<string, string> = {};
async function storeGet(key: string): Promise<string | null> {
  if (Platform.OS === 'web') return memory[key] ?? null;
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}
async function storeSet(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    memory[key] = value;
    return;
  }
  await SecureStore.setItemAsync(key, value);
}
async function storeDelete(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    delete memory[key];
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

/** Mock sign-in: accepts any phone/email + fixed demo OTP `123456`. */
export async function signIn(identifier: string): Promise<{ user: User; token: string }> {
  const user: User = {
    id: `citizen-${identifier.replace(/\W+/g, '').slice(-8) || 'demo'}`,
    name: identifier.includes('@') ? identifier.split('@')[0] : `Citizen ${identifier.slice(-4)}`,
    role: 'citizen',
    ...(identifier.includes('@') ? { email: identifier } : { phone: identifier }),
  };
  const token = `mock.${user.id}.${Date.now()}`;
  await storeSet(TOKEN_KEY, token);
  await storeSet(USER_KEY, JSON.stringify(user));
  return { user, token };
}

export async function verifyOtp(_otp: string): Promise<boolean> {
  // Demo OTP gate lives in the login screen; backend OTP will replace this.
  return true;
}

export async function restoreSession(): Promise<{ user: User; token: string } | null> {
  const [token, raw] = await Promise.all([storeGet(TOKEN_KEY), storeGet(USER_KEY)]);
  if (!token || !raw) return null;
  try {
    return { user: JSON.parse(raw) as User, token };
  } catch {
    return null;
  }
}

export async function signOut(): Promise<void> {
  await Promise.all([storeDelete(TOKEN_KEY), storeDelete(USER_KEY)]);
}
