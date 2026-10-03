import * as Location from 'expo-location';
import type { ReportLocation } from '@/src/types';

export type LocationState =
  | { status: 'idle' }
  | { status: 'requesting' }
  | { status: 'ready'; location: ReportLocation }
  | { status: 'denied' | 'unavailable' | 'timeout'; message: string };

export async function captureLocation(timeoutMs = 15_000): Promise<ReportLocation> {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== 'granted') {
    throw new Error('Location permission denied. Enable it to attach your position to the report.');
  }
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    // Expo's one-shot native location API has no AbortSignal. Bound the wait;
    // a late device result is ignored and never attached to a newer draft.
    const pos = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Location timed out. Retry outdoors or continue with your venue zone.')), timeoutMs);
      }),
    ]);
    const { latitude, longitude } = pos.coords;
    if (!Number.isFinite(latitude) || Math.abs(latitude) > 90 || !Number.isFinite(longitude) || Math.abs(longitude) > 180 || !Number.isFinite(pos.timestamp)) {
      throw new Error('Location unavailable. Move to open sky and retry.');
    }
    return {
      latitude,
      longitude,
      accuracy: pos.coords.accuracy != null && Number.isFinite(pos.coords.accuracy) && pos.coords.accuracy >= 0 ? pos.coords.accuracy : null,
      timestamp: new Date(pos.timestamp).toISOString(),
    };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Location')) throw error;
    throw new Error('Could not get your location. Check GPS and retry.');
  } finally { if (timer) clearTimeout(timer); }
}

/** Fresh GPS (default 15 min) is safe to auto-attach; stale fixes mislead responders. */
export function isLocationFresh(
  timestamp: string | null | undefined,
  maxAgeMs = 15 * 60 * 1000,
  nowMs = Date.now()
): boolean {
  if (!timestamp) return false;
  const captured = Date.parse(timestamp);
  return Number.isFinite(captured) && captured <= nowMs && nowMs - captured <= maxAgeMs;
}

export function formatCoords(loc: ReportLocation): string {
  const acc = loc.accuracy != null ? ` ±${Math.round(loc.accuracy)}m` : '';
  return `${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}${acc}`;
}
