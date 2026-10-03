import type { IncidentCategoryId } from './index';

export interface VoiceLanguage { code: string; label: string }
export interface VoiceConfig {
  configured: boolean;
  provider: 'sarvam';
  max_audio_seconds: number;
  max_audio_bytes: number;
  languages: VoiceLanguage[];
}

export interface VoiceFields {
  category: IncidentCategoryId | null;
  description: string;
  zone_id: string | null;
  urgency: 'low' | 'medium' | 'high' | null;
}

/** Unsubmitted suggestions, never an incident or dispatch instruction. */
export interface VoiceDraft {
  venue_id: string;
  transcript: string;
  language_code: string | null;
  fields: VoiceFields;
  warnings: string[];
  requires_confirmation: true;
}

export interface VoiceProvenance {
  transcript: string;
  languageCode: string | null;
}
