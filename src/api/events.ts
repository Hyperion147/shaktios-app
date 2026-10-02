import { apiRequest } from '@/src/api/client';
import type { BackendEvent } from '@/src/types';

/**
 * Single-user reporting reads only.
 * Uses shakti-os FastAPI (see ../shakti-os docs/API.md):
 *   GET /health, GET /events?limit=, POST /events (citizen_report), GET /me.
 * No incident / timeline / status / action / WebSocket — those are operator
 * dashboard concerns and stay out of this citizen reporting app.
 */
export const eventsApi = {
  list: (limit = 50) => apiRequest<BackendEvent[]>(`/events?limit=${limit}`),
  health: () => apiRequest<{ status: string; service: string }>('/health'),
};
