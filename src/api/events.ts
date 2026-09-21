import { apiRequest } from '@/src/api/client';
import type { BackendEvent, BackendIncident, TimelineEntry } from '@/src/types';

export const eventsApi = {
  list: (limit = 50) =>
    apiRequest<BackendEvent[]>(`/events?limit=${limit}`),
  getIncidents: (limit = 50) =>
    apiRequest<BackendIncident[]>(`/incidents?limit=${limit}`),
  getIncident: (id: string) =>
    apiRequest<BackendIncident>(`/incidents/${encodeURIComponent(id)}`),
  getTimeline: (id: string, limit = 100) =>
    apiRequest<TimelineEntry[]>(`/incidents/${encodeURIComponent(id)}/timeline?limit=${limit}`),
};
