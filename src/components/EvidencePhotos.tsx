import * as React from 'react';
import { ActivityIndicator, Image, Pressable, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Camera, ImagePlus } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Label } from '@/components/ui/label';
import { useSession, newPhotoId, type DraftPhoto } from '@/src/store/session';
import { THEME } from '@/lib/theme';
import {
  MAX_EVIDENCE_PHOTOS,
  captureEvidencePhoto,
  discardEvidencePhoto,
  uploadEvidencePhoto,
} from '@/src/api/evidence';

/** Compressed photo evidence with background bucket upload; shared by Camera step and Details. */
export function EvidencePhotos() {
  const { user, draft, addDraftPhotos, updateDraftPhoto, removeDraftPhoto } = useSession();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const draftRef = React.useRef(draft);
  draftRef.current = draft;

  const uploadPhoto = React.useCallback(async (photo: DraftPhoto) => {
    if (!user) {
      updateDraftPhoto(photo.id, { uploading: false, error: 'Sign in to upload photos.' });
      return;
    }
    updateDraftPhoto(photo.id, { uploading: true, error: null });
    try {
      const remoteUrl = await uploadEvidencePhoto(photo.localUri, user.id);
      updateDraftPhoto(photo.id, { uploading: false, remoteUrl });
    } catch (failure) {
      updateDraftPhoto(photo.id, {
        uploading: false,
        error: failure instanceof Error ? failure.message : 'Photo upload failed.',
      });
    }
  }, [user, updateDraftPhoto]);
  const uploadRef = React.useRef(uploadPhoto);
  uploadRef.current = uploadPhoto;

  // Photos captured elsewhere (e.g. the Click tab) upload as soon as this UI appears.
  useFocusEffect(React.useCallback(() => {
    draftRef.current.photos
      .filter((photo) => !photo.remoteUrl && !photo.uploading && !photo.error)
      .forEach((photo) => { void uploadRef.current(photo); });
  }, []));

  const pickPhoto = async (source: 'camera' | 'library') => {
    if (busy) return;
    const remaining = MAX_EVIDENCE_PHOTOS - draftRef.current.photos.length;
    if (remaining <= 0) return;
    setBusy(true);
    setError(null);
    try {
      const localUri = await captureEvidencePhoto(source, remaining);
      if (!localUri) return;
      const photo: DraftPhoto = { id: newPhotoId(), localUri, remoteUrl: null, uploading: false, error: null };
      addDraftPhotos([photo]);
      void uploadRef.current(photo);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Could not capture a photo.');
    } finally {
      setBusy(false);
    }
  };

  const dropPhoto = (photo: DraftPhoto) => {
    discardEvidencePhoto(photo.localUri);
    removeDraftPhoto(photo.id);
  };

  return (
    <View className="gap-1.5">
      <Label>Photo evidence (optional, up to {MAX_EVIDENCE_PHOTOS})</Label>
      <Text variant="muted" className="text-[12px]">
        Compressed on this device before upload. Photos help operators assess priority.
      </Text>
      {draft.photos.length ? (
        <View className="flex-row flex-wrap gap-2">
          {draft.photos.map((photo) => (
            <View key={photo.id} className="relative h-24 w-24 overflow-hidden rounded-xl border border-border bg-card">
              <Image source={{ uri: photo.localUri }} className="h-full w-full" />
              {photo.uploading ? (
                <View className="absolute inset-0 items-center justify-center bg-foreground/40">
                  <ActivityIndicator color="#fff" />
                </View>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}
      {draft.photos.some((photo) => photo.error && !photo.remoteUrl) ? (
        <View className="gap-1 rounded-2xl bg-[#FFF4D6] p-3">
          {draft.photos.filter((photo) => photo.error && !photo.remoteUrl).map((photo) => (
            <View key={photo.id} className="flex-row items-center justify-between gap-2">
              <Text className="flex-1 text-[12px]">{photo.error}</Text>
              <Pressable onPress={() => { void uploadRef.current(photo); }} className="px-2 py-1.5">
                <Text className="text-[12px] font-bold text-primary">Retry</Text>
              </Pressable>
              <Pressable onPress={() => dropPhoto(photo)} className="px-2 py-1.5">
                <Text className="text-[12px] font-bold text-destructive">Remove</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
      {draft.photos.length < MAX_EVIDENCE_PHOTOS ? (
        <View className="flex-row gap-2">
          <Pressable
            accessibilityRole="button" accessibilityLabel="Take a photo"
            disabled={busy} onPress={() => { void pickPhoto('camera'); }}
            className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-3.5">
            <Camera size={18} color={THEME.light.primary} />
            <Text className="text-[13px] font-bold text-primary">Take photo</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button" accessibilityLabel="Choose a photo"
            disabled={busy} onPress={() => { void pickPhoto('library'); }}
            className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-3.5">
            <ImagePlus size={18} color={THEME.light.primary} />
            <Text className="text-[13px] font-bold text-primary">Choose photo</Text>
          </Pressable>
        </View>
      ) : null}
      {busy ? (
        <View className="flex-row items-center gap-2">
          <ActivityIndicator color={THEME.light.primary} />
          <Text className="text-[12px] text-muted-foreground">Compressing and uploading…</Text>
        </View>
      ) : null}
      {error ? <Text className="text-[13px] text-destructive">{error}</Text> : null}
    </View>
  );
}
