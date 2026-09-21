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
  try {
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const { latitude, longitude } = pos.coords;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      throw new Error('Location unavailable. Move to open sky and retry.');
    }
    return {
      latitude,
      longitude,
      accuracy: pos.coords.accuracy ?? null,
      timestamp: new Date(pos.timestamp).toISOString(),
    };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Location')) throw error;
    throw new Error('Could not get your location. Check GPS and retry.');
  }
}

export function formatCoords(loc: ReportLocation): string {
  const acc = loc.accuracy != null ? ` ±${Math.round(loc.accuracy)}m` : '';
  return `${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}${acc}`;
}
