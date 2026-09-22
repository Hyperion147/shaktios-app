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
 * Never computes risk client-side.
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

export function toCitizenStatus(backendStatus: string): CitizenReport['status'] {
  switch (backendStatus) {
    case 'DETECTED':
      return 'received';
    case 'ASSESSING':
      return 'under_review';
    case 'RESPONDING':
      return 'action_initiated';
    case 'RESOLVED':
      return 'resolved';
    default:
      return 'submitted';
  }
}

/**
 * Recent citizen reports = GET /events filtered to citizen_report.
 * No user identity on the backend yet, so this is "recent reports",
 * not a per-user history.
 */
export async function fetchRecentReports(limit = 30): Promise<BackendEvent[]> {
  const events = await apiRequest<BackendEvent[]>(`/events?limit=${limit}`);
  return events.filter((e) => e.type === CITIZEN_EVENT_TYPE);
}
