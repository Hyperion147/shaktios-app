import Constants from 'expo-constants';
import type { IncidentCategory } from '@/src/types';

const extra = (Constants.expoConfig?.extra ?? {}) as { apiUrl?: string };

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? extra.apiUrl ?? 'http://localhost:8000';

export const REQUEST_TIMEOUT_MS = 15_000;

/** Source tag sent with every citizen signal so the pipeline can attribute it. */
export const CITIZEN_SOURCE = 'citizen_app';
export const CITIZEN_EVENT_TYPE = 'citizen_report';

export const INCIDENT_CATEGORIES: IncidentCategory[] = [
  { id: 'crowd', label: 'Crowd / overcrowding', hint: 'Density or crush risk observed' },
  { id: 'medical', label: 'Medical emergency', hint: 'Someone needs medical help' },
  { id: 'fire_smoke', label: 'Fire / smoke', hint: 'Fire, smoke, or burning smell' },
  { id: 'suspicious', label: 'Suspicious activity', hint: 'Unattended items or odd behaviour' },
  { id: 'lost_person', label: 'Lost person', hint: 'Missing child or person' },
  { id: 'violence', label: 'Violence / conflict', hint: 'Fight or threatening behaviour' },
  { id: 'infrastructure', label: 'Infrastructure issue', hint: 'Blocked exit, broken barrier, power' },
  { id: 'other', label: 'Other', hint: 'Something else authorities should know' },
];

export const MOCK_VENUE_EVENTS = [
  {
    id: 'evt-riverfest-2026',
    name: 'Riverfest Main Ground',
    description: 'Demo event — main stage and Gate 3 / Gate 4 zones.',
    locationLabel: 'gate_4',
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
