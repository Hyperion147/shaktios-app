import Constants from 'expo-constants';
import type { IncidentCategory } from '@/src/types';

const extra = (Constants.expoConfig?.extra ?? {}) as { apiUrl?: string };

/**
 * API base URL is injected into the Expo bundle at startup. Android's
 * localhost is the emulator/device itself, not the development computer, so
 * the checked-in fallback uses the Android emulator host alias.
 */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.platform?.android ? 'http://10.0.2.2:8000' : undefined) ??
  extra.apiUrl ??
  'http://localhost:8000';

/** Public Supabase configuration (publishable key only). */
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';

export function isSupabaseConfigured(): boolean {
  return SUPABASE_URL.length > 0 && SUPABASE_PUBLISHABLE_KEY.length > 0;
}

export const REQUEST_TIMEOUT_MS = 15_000;
export const CITIZEN_SOURCE = 'citizen_app';
export const CITIZEN_EVENT_TYPE = 'citizen_report';

export const INCIDENT_CATEGORIES: IncidentCategory[] = [
  { id: 'crowd', label: 'Crowd / Overcrowding', hint: 'Heavy pushing, overcrowding, crush risk' },
  { id: 'medical', label: 'Medical Emergency', hint: 'Someone needs medical help' },
  { id: 'fire_smoke', label: 'Fire / Smoke', hint: 'Fire, smoke, or burning smell' },
  { id: 'suspicious', label: 'Suspicious Activity', hint: 'Unattended items or odd behaviour' },
  { id: 'lost_person', label: 'Lost Person', hint: 'Missing child or person' },
  { id: 'violence', label: 'Violence / Conflict', hint: 'Fight or threatening behaviour' },
  {
    id: 'infrastructure',
    label: 'Infrastructure Issue',
    hint: 'Blocked exit, broken barrier, power',
  },
  { id: 'other', label: 'Other', hint: 'Something else authorities should know' },
];
