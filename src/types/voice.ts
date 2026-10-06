export type { VoiceConfig, VoiceDraft, VoiceFields, VoiceLanguage } from './contracts';

export interface VoiceProvenance {
  transcript: string;
  languageCode: string | null;
}
