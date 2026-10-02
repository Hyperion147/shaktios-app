import { apiRequest } from '@/src/api/client';
import { CITIZEN_EVENT_TYPE, CITIZEN_SOURCE } from '@/src/constants/config';
import type { BackendEvent, CitizenReport } from '@/src/types';
export interface SubmitReportInput {
  category: CitizenReport['category'];
  description: string;
  /** Backend correlation key — exact-match zone string (e.g. "Gate 4"). */
  locationLabel: string;
  latitude?: number | null;
  longitude?: number | null;
  accuracy?: number | null;
  eventId?: string | null;
  urgency?: 'normal' | 'high';
}

/** Citizen urgency → backend confidence signal. Default 0.7. */
const URGENCY_CONFIDENCE = { normal: 0.7, high: 0.9 } as const;

/**
 * Citizen observation → normalized backend signal.
 * POST /events with type "citizen_report"; the server-side
 * correlation/risk pipeline owns everything after ingest.
 * Never computes risk client-side. Never sends user identity —
 * FastAPI stamps reporter_id from the validated JWT.
 */
export async function submitReport(input: SubmitReportInput): Promise<BackendEvent> {
  return apiRequest<BackendEvent>('/events', {
    method: 'POST',
    body: {
      type: CITIZEN_EVENT_TYPE,
      source: CITIZEN_SOURCE,
      location: input.locationLabel.trim() || 'unspecified',
      confidence: URGENCY_CONFIDENCE[input.urgency ?? 'normal'],
      payload: {
        category: input.category,
        description: input.description.trim(),
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        accuracy: input.accuracy ?? null,
        venue_event_id: input.eventId ?? null,
        urgency: input.urgency ?? 'normal',
      },
    },
  });
}

export function toCitizenStatus(_backendStatus: string): CitizenReport['status'] {
  // Single-user reporting app: backend has no citizen-facing status endpoint
  // yet (see shakti-os docs/PRESENTATION_CONTEXT.md truth table). Screens use
  // a local demo badge; this helper is kept for when that endpoint lands.
  return 'submitted';
}

interface MeResponse {
  id: string;
  email?: string | null;
  role?: string | null;
}

/**
 * Recent citizen reports = GET /events filtered to citizen_report.
 * Authenticated requests carry the Supabase Bearer token automatically;
 * anonymous callers still get the public recent list.
 */
export async function fetchRecentReports(limit = 30): Promise<BackendEvent[]> {
  const events = await apiRequest<BackendEvent[]>(`/events?limit=${limit}`);
  return events.filter((e) => e.type === CITIZEN_EVENT_TYPE);
}

/**
 * My reports: verified identity from GET /me (JWT sub), then filter the
 * citizen_report events stamped with that reporter_id server-side.
 * The client never sends an arbitrary user id — identity comes from the JWT.
 */
export async function fetchMyReports(limit = 50): Promise<BackendEvent[]> {
  const me = await apiRequest<MeResponse>('/me');
  const events = await apiRequest<BackendEvent[]>(`/events?limit=${limit}`);
  return events.filter(
    (e) => e.type === CITIZEN_EVENT_TYPE && e.reporter_id === me.id,
  );
}
