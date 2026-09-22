import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '@/src/constants/config';

// SecureStore-backed storage so the Supabase session survives restarts on
// native. Web falls back to memory (SecureStore is unavailable there).
const memory: Record<string, string> = {};

const ExpoSecureStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') return memory[key] ?? null;
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      memory[key] = value;
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      delete memory[key];
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

let cached: SupabaseClient | null = null;

/**
 * Supabase client for Auth only. The app never touches backend tables
 * directly — all operational data goes through FastAPI, which validates
 * the Supabase JWT and talks to Supabase PostgreSQL server-side.
 */
export function getSupabase(): SupabaseClient {
  if (cached) return cached;
  cached = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: ExpoSecureStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
  return cached;
}

/** Current access token, or null when signed out / session expired. */
export async function getAccessToken(): Promise<string | null> {
  try {
    const { data } = await getSupabase().auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}
