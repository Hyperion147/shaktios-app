import Constants from 'expo-constants';
import type { IncidentCategory } from '@/src/types';

const extra = (Constants.expoConfig?.extra ?? {}) as { apiUrl?: string };

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? extra.apiUrl ?? 'http://localhost:8000';

/**
 * Public Supabase configuration (publishable key only — safe for clients).
 * Never add the service-role key or backend secrets here.
 */
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';

export const SUPABASE_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';

export function isSupabaseConfigured(): boolean {
  return SUPABASE_URL.length > 0 && SUPABASE_PUBLISHABLE_KEY.length > 0;
}

export const REQUEST_TIMEOUT_MS = 15_000;

/** Source tag sent with every citizen signal so the pipeline can attribute it. */
export const CITIZEN_SOURCE = 'citizen_app';
export const CITIZEN_EVENT_TYPE = 'citizen_report';

export const INCIDENT_CATEGORIES: IncidentCategory[] = [
  { id: 'crowd', label: 'Crowd / Overcrowding', hint: 'Heavy pushing, overcrowding, crush risk' },
  { id: 'medical', label: 'Medical Emergency', hint: 'Someone needs medical help' },
  { id: 'fire_smoke', label: 'Fire / Smoke', hint: 'Fire, smoke, or burning smell' },
  { id: 'suspicious', label: 'Suspicious Activity', hint: 'Unattended items or odd behaviour' },
  { id: 'lost_person', label: 'Lost Person', hint: 'Missing child or person' },
  { id: 'violence', label: 'Violence / Conflict', hint: 'Fight or threatening behaviour' },
  { id: 'infrastructure', label: 'Infrastructure Issue', hint: 'Blocked exit, broken barrier, power' },
  { id: 'other', label: 'Other', hint: 'Something else authorities should know' },
];

/** Demo default — maps to venue_event_id. Replace when backend event registry lands. */
export const DEFAULT_ACTIVE_EVENT_ID = 'evt-riverfest-2026';

/** Quick-pick textual zones. GPS stays optional; a plain label is enough. */
export const LOCATION_PRESETS = ['Gate 4', 'Main Stage', 'North Entrance'];

export const MOCK_VENUE_EVENTS = [
  {
    id: 'evt-riverfest-2026',
    name: 'Riverfest 2026',
    description: 'Main Ground — Main Stage, Food Court, Gates 3 & 4.',
    locationLabel: 'Gate 4',
    status: 'active' as const,
  },
  {
    id: 'evt-marathon-2026',
    name: 'City Marathon Start Zone',
    description: 'Demo event — start-line corrals.',
    locationLabel: 'start_line',
    status: 'active' as const,
  },
];

/** Human-readable event name for a venue_event_id. Falls back to the raw id. */
export function venueEventName(eventId: string | null | undefined): string {
  if (!eventId) return 'Riverfest 2026';
  return MOCK_VENUE_EVENTS.find((e) => e.id === eventId)?.name ?? eventId;
}
