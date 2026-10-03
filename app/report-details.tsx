import * as React from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Camera, ChevronDown, ImagePlus, Sparkles } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { CategoryIcon, PrimaryButton, ScreenHeader, Stepper } from '@/src/components/design';
import { useSession, type DraftPhoto } from '@/src/store/session';
import { newPhotoId } from '@/src/store/session';
import { INCIDENT_CATEGORIES } from '@/src/constants/config';
import { THEME } from '@/lib/theme';
import { cn } from '@/lib/utils';
import {
  MAX_EVIDENCE_PHOTOS,
  captureEvidencePhoto,
  discardEvidencePhoto,
  uploadEvidencePhoto,
} from '@/src/api/evidence';
import { assessPriority, type PriorityAssessment } from '@/src/api/priority';
import { isLocationFresh } from '@/src/utils/location';

const MAX_LEN = 500;
const URGENCY = [
  { id: 'low', label: 'Low' },
  { id: 'medium', label: 'Medium' },
  { id: 'high', label: 'High' },
] as const;

type AssistState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; assessment: PriorityAssessment; applied: boolean };

/** Details, photo evidence and AI urgency in one step; GPS is auto-attached. */
export default function ReportDetailsScreen() {
  const router = useRouter();
  const {
    user, draft, setDraft, activeEvent, deviceLocation, pendingLocation,
    addDraftPhotos, updateDraftPhoto, removeDraftPhoto, setPendingLocation,
    refreshDeviceLocation, getDraftRevision,
  } = useSession();
  const [error, setError] = React.useState<string | null>(null);
  const [photoError, setPhotoError] = React.useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = React.useState(false);
  const [assist, setAssist] = React.useState<AssistState>({ status: 'idle' });
  const category = INCIDENT_CATEGORIES.find((item) => item.id === draft.category);
  const uploadedCount = draft.photos.filter((photo) => photo.remoteUrl).length;
  const draftRef = React.useRef(draft);
  draftRef.current = draft;
  const assistRequest = React.useRef(0);

  // Keep the auto-attach fix warm while the citizen types; stale fixes never attach.
  useFocusEffect(React.useCallback(() => {
    let cancelled = false;
    const revision = getDraftRevision();
    const warm = async () => {
      if (!isLocationFresh(pendingLocation?.timestamp) && !isLocationFresh(deviceLocation?.timestamp)) {
        const location = await refreshDeviceLocation();
        if (!cancelled && location && revision === getDraftRevision()) setPendingLocation(location);
      }
    };
    void warm();
    return () => { cancelled = true; };
  }, [getDraftRevision, pendingLocation?.timestamp, deviceLocation?.timestamp, refreshDeviceLocation, setPendingLocation]));

  // Priority assist: Sarvam triage of the text, auto-applied until manually overridden.
  // Voice drafts already carry extraction urgency, so assist stays out of their way.
  React.useEffect(() => {
    if (draft.voice) return;
    const description = draft.description.trim();
    if (description.length < 12) {
      assistRequest.current += 1;
      setAssist({ status: 'idle' });
      return;
    }
    const request = ++assistRequest.current;
    const revision = getDraftRevision();
    setAssist({ status: 'loading' });
    const timer = setTimeout(() => {
      const controller = new AbortController();
      const run = async () => {
        try {
          const assessment = await assessPriority(
            {
              category: draftRef.current.category,
              description: draftRef.current.description,
              hasPhoto: draftRef.current.photos.some((photo) => photo.remoteUrl),
            },
            controller.signal
          );
          if (assistRequest.current !== request || revision !== getDraftRevision()) return;
          const applied = !draftRef.current.urgencyTouched;
          if (applied) setDraft({ urgency: assessment.suggested_urgency });
          setAssist({ status: 'ready', assessment, applied });
        } catch {
          if (assistRequest.current === request && revision === getDraftRevision()) {
            setAssist({ status: 'idle' });
          }
        }
      };
      void run();
    }, 800);
    return () => {
      assistRequest.current += 1;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.description, draft.category, draft.photos.length, uploadedCount, draft.voice]);

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

  const pickPhoto = async (source: 'camera' | 'library') => {
    if (photoBusy) return;
    const remaining = MAX_EVIDENCE_PHOTOS - draftRef.current.photos.length;
    if (remaining <= 0) return;
    setPhotoBusy(true);
    setPhotoError(null);
    try {
      const localUri = await captureEvidencePhoto(source, remaining);
      if (!localUri) return;
      const photo: DraftPhoto = { id: newPhotoId(), localUri, remoteUrl: null, uploading: true, error: null };
      addDraftPhotos([photo]);
      void uploadPhoto(photo);
    } catch (failure) {
      setPhotoError(failure instanceof Error ? failure.message : 'Could not capture a photo.');
    } finally {
      setPhotoBusy(false);
    }
  };

  const dropPhoto = (photo: DraftPhoto) => {
    discardEvidencePhoto(photo.localUri);
    removeDraftPhoto(photo.id);
  };

  const next = () => {
    if (!activeEvent || activeEvent.status === 'ended') {
      setError('Join an active or upcoming event before continuing.');
      return;
    }
    if (!draft.zoneId) {
      setError('Select the venue zone where you observed the incident.');
      return;
    }
    if (!draft.description.trim() && draft.category === 'other') {
      setError('Please describe what you observed.');
      return;
    }
    if (draft.photos.some((photo) => photo.uploading)) {
      setError('Wait for photo uploads to finish before continuing.');
      return;
    }
    setError(null);
    router.push('/review');
  };

  return (
    <ScreenContainer className="px-0">
      <View className="px-5">
        <ScreenHeader title="Report Incident" onBack={() => router.back()} />
        <Stepper steps={['Category', 'Details', 'Review']} current={1} />
      </View>
      <ScrollView className="flex-1 px-5" contentContainerClassName="gap-4 pb-6">
        <View className="gap-1.5">
          <Label>Category</Label>
          <Pressable
            onPress={() => router.back()}
            className="flex-row items-center gap-2.5 rounded-2xl border border-border bg-card px-4 py-3">
            {category ? <CategoryIcon id={category.id} size={32} /> : null}
            <Text className="flex-1 text-[14px] font-semibold">{category?.label ?? 'Select'}</Text>
            <ChevronDown size={18} color={THEME.light.mutedForeground} />
          </Pressable>
        </View>

        <View className="gap-1.5">
          <Label>Description (optional)</Label>
          <Textarea
            maxLength={MAX_LEN}
            placeholder="Describe what you observed and where it happened."
            placeholderTextColor={THEME.light.mutedForeground}
            value={draft.description}
            onChangeText={(text) => setDraft({ description: text })}
            className="min-h-[110px] rounded-2xl border-border bg-card text-[14px]"
          />
          <Text className="text-right text-[11px] text-muted-foreground">
            {draft.description.length}/{MAX_LEN}
          </Text>
        </View>

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
                  <Pressable onPress={() => { void uploadPhoto(photo); }} className="px-2 py-1.5">
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
                disabled={photoBusy} onPress={() => { void pickPhoto('camera'); }}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-3.5">
                <Camera size={18} color={THEME.light.primary} />
                <Text className="text-[13px] font-bold text-primary">Take photo</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button" accessibilityLabel="Choose a photo"
                disabled={photoBusy} onPress={() => { void pickPhoto('library'); }}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-3.5">
                <ImagePlus size={18} color={THEME.light.primary} />
                <Text className="text-[13px] font-bold text-primary">Choose photo</Text>
              </Pressable>
            </View>
          ) : null}
          {photoBusy ? (
            <View className="flex-row items-center gap-2">
              <ActivityIndicator color={THEME.light.primary} />
              <Text className="text-[12px] text-muted-foreground">Compressing and uploading…</Text>
            </View>
          ) : null}
          {photoError ? <Text className="text-[13px] text-destructive">{photoError}</Text> : null}
        </View>

        <View className="gap-1.5">
          <Label>Venue zone</Label>
          <Text variant="muted" className="text-[12px]">
            Choose a zone from the selected event. Reports use its canonical id for backend routing.
          </Text>
          <View className="gap-2">
            {(activeEvent?.zones ?? []).map((zone) => {
              const selected = draft.zoneId === zone.id;
              return (
                <Pressable
                  key={zone.id}
                  onPress={() => setDraft({ zoneId: zone.id, locationLabel: zone.label })}
                  className={cn(
                    'rounded-2xl border px-4 py-3',
                    selected ? 'border-primary bg-primary/5' : 'border-border bg-card'
                  )}>
                  <Text
                    className={cn('text-[13px] font-medium', selected && 'font-bold text-primary')}>
                    {zone.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {!activeEvent?.zones.length ? (
            <Text className="text-[13px] text-destructive">
              No zones are available for this event.
            </Text>
          ) : null}
        </View>

        <View className="gap-1.5">
          <Label>Urgency Level</Label>
          {assist.status === 'loading' ? (
            <View className="flex-row items-center gap-2 rounded-2xl bg-primary/5 px-4 py-3">
              <ActivityIndicator color={THEME.light.primary} />
              <Text className="text-[12px] text-muted-foreground">Priority assist is reading your report…</Text>
            </View>
          ) : null}
          {assist.status === 'ready' ? (
            <View className="gap-1.5 rounded-2xl bg-primary/5 p-4">
              <View className="flex-row items-center gap-1.5">
                <Sparkles size={16} color={THEME.light.primary} />
                <Text className="text-[13px] font-bold text-primary">
                  Suggested: {assist.assessment.suggested_urgency.charAt(0).toUpperCase() + assist.assessment.suggested_urgency.slice(1)}
                  {assist.assessment.priority ? ' · Priority' : ''}
                </Text>
              </View>
              {assist.assessment.reasons.map((reason) => (
                <Text key={reason} className="text-[12px] leading-5 text-muted-foreground">• {reason}</Text>
              ))}
              <Text className="text-[11px] text-muted-foreground">
                {assist.applied ? 'Applied automatically — change below anytime.' : 'You set urgency manually.'}
              </Text>
            </View>
          ) : null}
          <ToggleGroup
            type="single"
            value={draft.urgency}
            onValueChange={(value) => {
              if (value) setDraft({ urgency: value as 'low' | 'medium' | 'high', urgencyTouched: true });
            }}
            className="gap-2">
            {URGENCY.map((item) => {
              const selected = draft.urgency === item.id;
              return (
                <ToggleGroupItem
                  key={item.id}
                  value={item.id}
                  className={cn(
                    'h-12 flex-1 rounded-2xl border',
                    selected ? 'border-primary bg-primary' : 'border-border bg-card'
                  )}>
                  <Text
                    className={cn(
                      'text-[13px] font-bold',
                      selected ? 'text-primary-foreground' : 'text-muted-foreground'
                    )}>
                    {item.label}
                  </Text>
                </ToggleGroupItem>
              );
            })}
          </ToggleGroup>
        </View>

        {isLocationFresh(pendingLocation?.timestamp) || isLocationFresh(deviceLocation?.timestamp) ? (
          <View className="flex-row items-center gap-2 rounded-2xl bg-[#E4F5F0] p-3.5">
            <Text className="flex-1 text-[12px] font-semibold text-[#08766A]">
              GPS will attach automatically — no extra step needed.
            </Text>
          </View>
        ) : (
          <View className="gap-1 rounded-2xl bg-[#FFF4D6] p-3.5">
            <Text className="text-[12px] font-semibold">
              Location is off, so this report will use the venue zone only. Enable it in setup for accurate GPS.
            </Text>
          </View>
        )}

        {error ? <Text className="text-[13px] text-destructive">{error}</Text> : null}
        <PrimaryButton title="Next" onPress={next} />
      </ScrollView>
    </ScreenContainer>
  );
}
