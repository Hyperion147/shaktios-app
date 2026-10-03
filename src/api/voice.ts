import { Platform } from 'react-native';
import { File } from 'expo-file-system';
import { apiRequest } from './client';
import type { VenueEvent } from '../types';
import type { VoiceConfig, VoiceDraft } from '../types/voice';
import { MAX_VOICE_BYTES, MAX_VOICE_SECONDS, parseVoiceDraft } from '../utils/voice-draft';

export async function fetchVoiceConfig(signal?: AbortSignal): Promise<VoiceConfig> {
  const config = await apiRequest<VoiceConfig>('/voice/config', { signal });
  if (!config || config.provider !== 'sarvam' || typeof config.configured !== 'boolean'
    || !Number.isFinite(config.max_audio_seconds) || config.max_audio_seconds <= 0
    || !Number.isFinite(config.max_audio_bytes) || config.max_audio_bytes <= 0
    || !Array.isArray(config.languages) || !config.languages.length
    || !config.languages.every((language) => language && typeof language.code === 'string' && typeof language.label === 'string')) {
    throw new Error('Voice service configuration is unavailable. Please use the manual form.');
  }
  return { ...config, max_audio_seconds: Math.min(config.max_audio_seconds, MAX_VOICE_SECONDS), max_audio_bytes: Math.min(config.max_audio_bytes, MAX_VOICE_BYTES) };
}

/** Audio is sent only after explicit upload consent. No provider key enters the app. */
export async function requestVoiceDraft(
  uri: string, venue: VenueEvent, languageCode: string, signal: AbortSignal,
): Promise<VoiceDraft> {
  const body = new FormData();
  body.append('venue_id', venue.id);
  body.append('language_code', languageCode);
  body.append('consent', 'true');
  if (Platform.OS === 'web') {
    if (!uri.startsWith('blob:')) throw new Error('This recording is no longer available. Please record again.');
    const blob = await (await fetch(uri, { signal })).blob();
    if (!blob.size || blob.size > MAX_VOICE_BYTES) throw new Error('Record a short, non-empty clip under 25 seconds.');
    body.append('audio', blob, 'voice.webm');
  } else {
    if (!uri.startsWith('file://')) throw new Error('This recording is no longer available. Please record again.');
    const file = new File(uri);
    if (!file.exists || !file.size || file.size > MAX_VOICE_BYTES) throw new Error('Record a short, non-empty clip under 25 seconds.');
    // React Native's fetch accepts a file descriptor; browsers use Blob above.
    body.append('audio', { uri, name: 'voice.m4a', type: 'audio/mp4' } as unknown as Blob);
  }
  const result = await apiRequest<unknown>('/voice/draft', { method: 'POST', body, signal, timeoutMs: 100_000 });
  return parseVoiceDraft(result, venue);
}

/** Best-effort cleanup of the temporary recording created by expo-audio. */
export function discardRecording(uri: string | null): void {
  if (!uri) return;
  try {
    if (Platform.OS === 'web') {
      if (uri.startsWith('blob:')) URL.revokeObjectURL(uri);
    } else if (uri.startsWith('file://')) {
      const file = new File(uri);
      if (file.exists) file.delete();
    }
  } catch {
    // Never log the private file path. The OS can reclaim the cache on failure.
  }
}
