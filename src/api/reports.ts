import { apiRequest } from '@/src/api/client';
import { CITIZEN_EVENT_TYPE, CITIZEN_SOURCE } from '@/src/constants/config';
import type { BackendEvent, CitizenReportRecord, IncidentCategoryId } from '@/src/types';

export interface SubmitReportInput {
  category: IncidentCategoryId;
  description: string;
  /** Human-readable label retained in the payload for operators. */
  locationLabel: string;
  /** Canonical VenueZone.id sent as the event's location. */
  zoneId: string;
  latitude?: number | null;
  longitude?: number | null;
  accuracy?: number | null;
  eventId: string;
  urgency?: 'normal' | 'low' | 'medium' | 'high';
}

const URGENCY_CONFIDENCE = { normal: 0.7, low: 0.7, medium: 0.7, high: 0.9 } as const;

/** Submit one authenticated citizen observation to the backend. */
export async function submitReport(input: SubmitReportInput): Promise<BackendEvent> {
  const zoneId = input.zoneId.trim();
  const eventId = input.eventId.trim();
  if (!zoneId || !eventId) {
    throw new Error('Select an event and zone before submitting your report.');
  }

  return apiRequest<BackendEvent>('/events', {
    method: 'POST',
    body: {
      type: CITIZEN_EVENT_TYPE,
      source: CITIZEN_SOURCE,
      location: zoneId,
      confidence: URGENCY_CONFIDENCE[input.urgency ?? 'normal'],
      payload: {
        category: input.category,
        description: input.description.trim(),
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        accuracy: input.accuracy ?? null,
        venue_event_id: eventId,
        location_label: input.locationLabel.trim(),
        urgency: input.urgency ?? 'normal',
      },
    },
  });
}

/** Server-authoritative, ownership-filtered citizen reports. */
export function fetchMyReports(limit = 50, offset = 0, signal?: AbortSignal): Promise<CitizenReportRecord[]> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  return apiRequest<CitizenReportRecord[]>(`/me/reports?${params.toString()}`, { signal });
}

/** Fetch one report; the backend returns 404 for a missing or unowned id. */
export function fetchMyReport(id: string, signal?: AbortSignal): Promise<CitizenReportRecord> {
  return apiRequest<CitizenReportRecord>(`/me/reports/${encodeURIComponent(id)}`, { signal });
}
