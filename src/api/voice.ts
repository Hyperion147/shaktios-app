import { Platform } from 'react-native';
import { File, UploadType } from 'expo-file-system';
import {
  apiRequest,
  assertAuthRevision,
  currentAuthRevision,
  currentAuthToken,
  decodeApiResponse,
} from './client';
import { API_BASE_URL } from '../constants/config';
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
  if (Platform.OS === 'web') {
    const body = new FormData();
    body.append('venue_id', venue.id);
    body.append('language_code', languageCode);
    body.append('consent', 'true');
    if (!uri.startsWith('blob:')) throw new Error('This recording is no longer available. Please record again.');
    const blob = await (await fetch(uri, { signal })).blob();
    if (!blob.size || blob.size > MAX_VOICE_BYTES) throw new Error('Record a short, non-empty clip under 25 seconds.');
    const extension = blob.type.includes('mp4') ? 'm4a' : blob.type.includes('ogg') ? 'ogg' : 'webm';
    body.append('audio', blob, `voice.${extension}`);
    const result = await apiRequest<unknown>('/voice/draft', { method: 'POST', body, signal, timeoutMs: 100_000 });
    return parseVoiceDraft(result, venue);
  } else {
    if (!uri.startsWith('file://')) throw new Error('This recording is no longer available. Please record again.');
    const file = new File(uri);
    if (!file.exists || !file.size || file.size > MAX_VOICE_BYTES) throw new Error('Record a short, non-empty clip under 25 seconds.');
    // Native multipart goes through the FileSystem uploader: fetch with a
    // { uri, name, type } descriptor is unreliable for recorder files, and
    // its failure surfaces as a generic network error. Browsers use Blob above.
    const revision = currentAuthRevision();
    const controller = new AbortController();
    const cancel = () => controller.abort();
    if (signal.aborted) cancel();
    else signal.addEventListener('abort', cancel, { once: true });
    const timeout = setTimeout(cancel, 100_000);
    try {
      const token = await currentAuthToken();
      assertAuthRevision(revision);
      const result = await file.upload(`${API_BASE_URL}/voice/draft`, {
        uploadType: UploadType.MULTIPART,
        fieldName: 'audio',
        mimeType: 'audio/mp4',
        parameters: { venue_id: venue.id, language_code: languageCode, consent: 'true' },
        ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
        signal: controller.signal,
      });
      assertAuthRevision(revision);
      return parseVoiceDraft(decodeApiResponse<unknown>(result.status, result.body), venue);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(
          signal.aborted ? 'Request cancelled.' : 'Request timed out. Please try again.'
        );
      }
      // Mapped API errors (validation/auth/server with status codes) pass
      // through; transport failures become the standard network message.
      if (error instanceof Error && 'code' in error) throw error;
      throw new Error('Unable to reach the ShaktiOS server. Please try again.');
    } finally {
      clearTimeout(timeout);
      signal.removeEventListener('abort', cancel);
    }
  }
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
