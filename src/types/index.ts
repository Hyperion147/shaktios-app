// Shared ShaktiOS citizen-app types.
// Backend-authoritative models mirror services/api (FastAPI).
// VenueEvent/User/Auth are client-side adapters — the backend has no
// auth or venue-event registry yet (see docs/API.md).

export interface User {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  role: 'citizen';
}

/** Venue/event onboarding context (client-side until backend adds a registry). */
export interface VenueEvent {
  id: string;
  name: string;
  description?: string;
  locationLabel?: string;
  status: 'active' | 'upcoming' | 'ended';
  startTime?: string;
  endTime?: string;
}

export type IncidentCategoryId =
  | 'crowd'
  | 'medical'
  | 'fire_smoke'
  | 'suspicious'
  | 'lost_person'
  | 'violence'
  | 'infrastructure'
  | 'other';

export interface IncidentCategory {
  id: IncidentCategoryId;
  label: string;
  /** Backend signal hint — citizen category maps into the payload, never risk. */
  hint: string;
}

export interface ReportLocation {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  timestamp: string;
}

export type CitizenReportStatus =
  | 'submitted'
  | 'received'
  | 'under_review'
  | 'action_initiated'
  | 'resolved'
  | 'rejected';

/** Raw citizen observation. Risk is computed server-side only. */
export interface CitizenReport {
  id: string;
  eventId?: string | null;
  category: IncidentCategoryId;
  description: string;
  location: ReportLocation | null;
  locationLabel: string;
  urgency: 'low' | 'normal' | 'high';
  createdAt: string;
  status: CitizenReportStatus;
  backendEventId?: string;
}

/** Backend signal event (POST /events). */
export interface BackendEvent {
  id: string;
  type: string;
  source: string;
  timestamp: string;
  location: string;
  confidence: number;
  payload: Record<string, unknown>;
}

export type BackendIncidentStatus = 'DETECTED' | 'ASSESSING' | 'RESPONDING' | 'RESOLVED';
export type BackendSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface BackendIncident {
  id: string;
  type: string;
  location: string;
  status: BackendIncidentStatus;
  severity: BackendSeverity;
  confidence: number;
  risk: number;
  factors: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface TimelineEntry {
  id: string;
  incident_id: string;
  type: string;
  timestamp: string;
  details: Record<string, unknown>;
}

export interface ApiError {
  message: string;
  status?: number;
  code: string;
}
