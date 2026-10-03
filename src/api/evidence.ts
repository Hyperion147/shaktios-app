import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { File } from 'expo-file-system';
import { getSupabase } from './supabase';

export const EVIDENCE_BUCKET = 'report-evidence';
export const MAX_EVIDENCE_PHOTOS = 3;
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const MAX_SIDE_PX = 1600;

/** Remove a local temp photo; remote uploads are never deleted from the device. */
export function discardEvidencePhoto(localUri: string | null): void {
  if (!localUri) return;
  try {
    const file = new File(localUri);
    if (file.exists) file.delete();
  } catch {
    // The OS reclaims cache files on failure.
  }
}

function storageErrorMessage(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('bucket not found') || lower.includes('bucket_not_found')) {
    return 'Photo storage is not set up yet. The report can still be submitted without photos.';
  }
  if (lower.includes('violates row-level security') || lower.includes('row-level security')) {
    return 'Photo upload was rejected. Sign out and sign in again, or submit without photos.';
  }
  return message || 'Photo upload failed. Try again or submit without photos.';
}

/** Capture one photo and return a compressed JPEG file URI, or null when cancelled. */
export async function captureEvidencePhoto(
  source: 'camera' | 'library',
  remaining: number
): Promise<string | null> {
  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      throw new Error('Camera access was denied. Enable it in device settings, or submit without photos.');
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: false,
      exif: false,
    });
    if (result.canceled || !result.assets.length) return null;
    return compressEvidencePhoto(result.assets[0].uri, result.assets[0].width, result.assets[0].height);
  }
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Photo library access was denied. Enable it in device settings, or submit without photos.');
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.7,
    allowsEditing: false,
    exif: false,
    selectionLimit: Math.max(1, Math.min(remaining, MAX_EVIDENCE_PHOTOS)),
  });
  if (result.canceled || !result.assets.length) return null;
  return compressEvidencePhoto(result.assets[0].uri, result.assets[0].width, result.assets[0].height);
}

/** Downscale long photos and re-encode as JPEG; originals are never uploaded. */
export async function compressEvidencePhoto(uri: string, width?: number, height?: number): Promise<string> {
  const longest = Math.max(width ?? 0, height ?? 0);
  const actions = longest > MAX_SIDE_PX
    ? [{ resize: { width: width != null && height != null && width >= height ? MAX_SIDE_PX : undefined, height: width != null && height != null && height > width ? MAX_SIDE_PX : undefined } }]
    : [];
  const output = await manipulateAsync(uri, actions, { compress: 0.65, format: SaveFormat.JPEG });
  const file = new File(output.uri);
  if (!file.exists || !file.size) throw new Error('This photo could not be read. Try another one.');
  if (file.size > MAX_UPLOAD_BYTES) throw new Error('This photo is too large even after compression. Try another one.');
  return output.uri;
}

/** Upload a compressed photo to the report-evidence bucket; returns its public URL. */
export async function uploadEvidencePhoto(localUri: string, userId: string): Promise<string> {
  const file = new File(localUri);
  if (!file.exists || !file.size) throw new Error('This photo is no longer available. Capture it again.');
  if (file.size > MAX_UPLOAD_BYTES) throw new Error('This photo is too large. Capture it again.');
  const random = Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0');
  const path = `${userId}/${Date.now().toString(36)}-${random}.jpg`;
  const bytes = await file.bytes();
  const { error } = await getSupabase().storage.from(EVIDENCE_BUCKET).upload(path, bytes, {
    contentType: 'image/jpeg',
    upsert: false,
  });
  if (error) throw new Error(storageErrorMessage(error.message));
  const { data } = getSupabase().storage.from(EVIDENCE_BUCKET).getPublicUrl(path);
  if (!data.publicUrl) throw new Error('Photo upload failed. Try again or submit without photos.');
  return data.publicUrl;
}
