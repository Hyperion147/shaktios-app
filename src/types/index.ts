// Client-only types and aliases for the generated API contracts.
// The generated wire models are refreshed from shakti-os/scripts/generate_contracts.py.
import type {
  CitizenReport as ContractCitizenReport,
  Event as ContractEvent,
  Incident as ContractIncident,
  IncidentCategoryId as ContractIncidentCategoryId,
  IncidentSeverity,
  IncidentStatus,
  TimelineEntry as ContractTimelineEntry,
  Venue as ContractVenue,
  VenueZone as ContractVenueZone,
} from './contracts';

export type {
  CameraDetectionInput,
  EventInput,
  Integrations,
  Me,
  PriorityAssessment,
  PublicOverview,
  ReportStatus,
  Urgency,
  VoiceConfig,
  VoiceDraft,
  VoiceFields,
  VoiceLanguage,
} from './contracts';

export interface User {
  id: string;
  name: string;
  email?: string;
  role: 'citizen';
}

export type VenueZone = ContractVenueZone;
/** Venue metadata returned by GET /venues and GET /venues/{id}. */
export type VenueEvent = ContractVenue;

export type IncidentCategoryId = ContractIncidentCategoryId;

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

export type BackendIncidentStatus = IncidentStatus;
export type BackendSeverity = IncidentSeverity;
export type BackendEvent = ContractEvent;
export type CitizenReportRecord = ContractCitizenReport;
export type BackendIncident = ContractIncident;
export type TimelineEntry = ContractTimelineEntry;
export type Event = ContractEvent;

export interface ApiError {
  message: string;
  status?: number;
  code: string;
}

export type Location = ReportLocation;
