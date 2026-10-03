// Shared ShaktiOS citizen-app types.
// Auth identity comes from Supabase Auth (JWT `sub`). Operational data is
// always loaded from the FastAPI API; this file contains no demo records.

export interface User {
  id: string;
  name: string;
  email?: string;
  role: 'citizen';
}

export interface VenueZone {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
}

/** Venue metadata returned by GET /venues and GET /venues/{id}. */
export interface VenueEvent {
  id: string;
  name: string;
  description: string;
  venue: string;
  locationLabel: string;
  zones: VenueZone[];
  status: 'active' | 'upcoming' | 'ended';
  startTime: string | null;
  endTime: string | null;
  helpline: string | null;
}

export type IncidentCategoryId =
  | 'crowd'
  | 'medical'
  | 'lost_person'
  | 'fire_smoke'
  | 'suspicious'
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

export type ReportStatus =
  'submitted' | 'received' | 'under_review' | 'action_initiated' | 'resolved';

export type BackendIncidentStatus = 'DETECTED' | 'ASSESSING' | 'RESPONDING' | 'RESOLVED';
export type BackendSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/** Raw event returned by POST /events and embedded in report responses. */
export interface BackendEvent {
  id: string;
  type: string;
  source: string;
  timestamp: string;
  location: string;
  confidence: number;
  payload: Record<string, unknown>;
  reporter_id?: string | null;
}

/** Citizen-owned event returned by GET /me/reports and GET /me/reports/{id}. */
export interface CitizenReportRecord extends BackendEvent {
  incident_id: string | null;
  incident_status: BackendIncidentStatus | null;
  report_status: ReportStatus;
  venue_name: string | null;
}

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

// Backwards-compatible name used by a few route declarations.
export type Event = VenueEvent;
export type Location = ReportLocation;
