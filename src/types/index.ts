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
  | 'lost_person'
  | 'fire_smoke'
  | 'suspicious'
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

// ---- Spec-facing aliases (same models, canonical names) ----
/** Provisional: backend has no venue-event registry yet; client-side only. */
export type Event = VenueEvent;
/** Citizen-facing category config; backend receives the id as a plain string. */
export type ReportCategory = IncidentCategory;
/** Structured GPS fix; always optional alongside the textual zone label. */
export type Location = ReportLocation;
/** Citizen-facing lifecycle; backend owns incident status separately. */
export type ReportStatus = CitizenReportStatus;

/**
 * Provisional submission envelope.
 * ReportsApi.submitReport() currently maps this onto the ACTUAL backend
 * schema (POST /events, type "citizen_report"). `photoUri` is captured
 * locally only — the backend MVP has no media upload yet.
 */
export interface ReportSubmission {
  category: IncidentCategoryId;
  description: string;
  locationLabel: string;
  urgency: CitizenReport['urgency'];
  gps: ReportLocation | null;
  photoUri: string | null;
  eventId: string | null;
}
