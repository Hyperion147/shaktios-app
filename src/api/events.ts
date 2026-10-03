import { apiRequest } from '@/src/api/client';
import type { BackendEvent, VenueEvent } from '@/src/types';

export const eventsApi = {
  list: (limit = 50) => apiRequest<BackendEvent[]>(`/events?limit=${limit}`),
  health: () => apiRequest<{ status: string; service: string }>('/health'),
};

/** Venue registry is server-owned; the app never ships a fallback venue list. */
export function fetchVenues(): Promise<VenueEvent[]> {
  return apiRequest<VenueEvent[]>('/venues');
}

export function fetchVenue(id: string): Promise<VenueEvent> {
  return apiRequest<VenueEvent>(`/venues/${encodeURIComponent(id)}`);
}
