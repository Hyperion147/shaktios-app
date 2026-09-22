import { apiRequest } from '@/src/api/client';
import type { BackendEvent } from '@/src/types';

/**
 * Citizen-safe event reads. Incident, timeline, status, action, and
 * WebSocket feeds are operator/dashboard concerns and intentionally
 * not exposed here — this app ends at reporting.
 */
export const eventsApi = {
  list: (limit = 50) => apiRequest<BackendEvent[]>(`/events?limit=${limit}`),
};
