import * as React from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { LocateFixed, TriangleAlert } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { PrimaryButton, ScreenHeader, Stepper } from '@/src/components/design';
import { useSession } from '@/src/store/session';
import { submitReport } from '@/src/api/reports';
import { normalizeError } from '@/src/api/client';
import { INCIDENT_CATEGORIES } from '@/src/constants/config';
import { formatCoords, isLocationFresh } from '@/src/utils/location';
import { THEME } from '@/lib/theme';

function Row({ label, children, onEdit }: { label: string; children: React.ReactNode; onEdit?: () => void }) {
  return (
    <Card className="gap-1 rounded-2xl p-4">
      <View className="flex-row items-center justify-between gap-2">
        <Text className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</Text>
        {onEdit && <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${label.toLowerCase()}`} onPress={onEdit} className="min-h-11 justify-center px-2"><Text className="text-[12px] font-bold text-primary">Edit</Text></Pressable>}
      </View>
      {children}
    </Card>
  );
}

/** Review and submit one authenticated report. */
export default function ReviewScreen() {
  const router = useRouter();
  const { user, draft, activeEvent, pendingLocation, setPendingLocation, refreshDeviceLocation, resetDraft, getDraftRevision } = useSession();
  const [busy, setBusy] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [confirmedRevision, setConfirmedRevision] = React.useState<number | null>(null);
  const confirmed = confirmedRevision !== null && confirmedRevision === getDraftRevision();
  const submittingRef = React.useRef(false);
  const mounted = React.useRef(true);
  useFocusEffect(React.useCallback(() => {
    mounted.current = true;
    setConfirmedRevision(null);
    return () => { mounted.current = false; };
  }, []));
  const validVenue = activeEvent && activeEvent.status !== 'ended' && activeEvent.zones.some((zone) => zone.id === draft.zoneId);
  const validDescription = draft.description.length <= 500 && (!(draft.voice || draft.category === 'other') || Boolean(draft.description.trim()));
  const photosUploading = draft.photos.some((photo) => photo.uploading);
  const canSubmit = Boolean(user && validVenue && validDescription && (!draft.voice || confirmed) && !photosUploading);

  const refreshGps = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const location = await refreshDeviceLocation(8000);
      if (mounted.current) setPendingLocation(location);
    } finally {
      if (mounted.current) setRefreshing(false);
    }
  };

  const categoryLabel =
    INCIDENT_CATEGORIES.find((item) => item.id === draft.category)?.label ?? draft.category;
  const urgencyLabel = draft.urgency.charAt(0).toUpperCase() + draft.urgency.slice(1);

  const submit = async () => {
    if (submittingRef.current) return;
    if (!user) {
      setError('You must be signed in to submit a citizen report.');
      return;
    }
    if (!activeEvent || !draft.zoneId || !validVenue) {
      setError('Select an active event and one of its registered venue zones before submitting.');
      return;
    }
    if (!validDescription) {
      setError('Review the description. Voice reports and Other require a description of at most 500 characters.');
      return;
    }
    if (draft.voice && !confirmed) {
      setError('Confirm that you reviewed the voice-filled report before submitting.');
      return;
    }
    if (photosUploading) {
      setError('Wait for photo uploads to finish before submitting.');
      return;
    }
    const revision = getDraftRevision();
    submittingRef.current = true;
    setBusy(true);
    setError(null);
    let submitRevision = revision;
    try {
      // Prefer the warm auto-attach fix; refresh once when stale, else zone-only.
      // Syncing location bumps the revision by exactly one; anything else
      // (account, venue or draft change mid-flight) still invalidates submit.
      let location = isLocationFresh(pendingLocation?.timestamp) ? pendingLocation : null;
      if (!location) {
        location = await refreshDeviceLocation(8000);
        if (mounted.current) setPendingLocation(location);
      }
      const settled = getDraftRevision();
      if (!mounted.current || (settled !== revision && settled !== revision + 1)) return;
      submitRevision = settled;
      const event = await submitReport({
        category: draft.category,
        description: draft.description,
        locationLabel: draft.locationLabel,
        zoneId: draft.zoneId,
        latitude: location?.latitude ?? null,
        longitude: location?.longitude ?? null,
        accuracy: location?.accuracy ?? null,
        eventId: activeEvent.id,
        urgency: draft.urgency,
        photo_urls: draft.photos.map((photo) => photo.remoteUrl).filter((url): url is string => Boolean(url)),
      });
      if (!mounted.current || submitRevision !== getDraftRevision()) return;
      resetDraft();
      router.replace({ pathname: '/submitted', params: { id: event.id } });
    } catch (e) {
      if (!mounted.current || submitRevision !== getDraftRevision()) return;
      const err = normalizeError(e);
      setError(
        err.code === 'unauthorized'
          ? 'The server rejected this session even though the app is signed in. Retry once; if it persists, sign out and sign in again.'
          : err.message
      );
    } finally {
      submittingRef.current = false;
      setBusy(false);
    }
  };

  return (
    <ScreenContainer className="px-0">
      <View className="px-5">
        <ScreenHeader title="Review Report" onBack={() => router.back()} />
        <Stepper steps={['Category', 'Details', 'Review']} current={2} />
      </View>
      <ScrollView className="flex-1 px-5" contentContainerClassName="gap-3 pb-6">
        <Row label="Event">
          <Text className="text-[14px] font-bold">{activeEvent?.name ?? '—'}</Text>
        </Row>
        <Row label="Category" onEdit={busy ? undefined : () => router.push('/report')}>
          <Text className="text-[14px] font-bold">{categoryLabel}</Text>
        </Row>
        <Row label="Description" onEdit={busy ? undefined : () => router.push('/report-details')}>
          <Text className="text-[13px] leading-5">
            {draft.description || 'No description provided.'}
          </Text>
        </Row>
        <Row label="Venue zone" onEdit={busy ? undefined : () => router.push('/report-details')}>
          <Text className="text-[14px] font-bold">{draft.locationLabel || '—'}</Text>
          <Text variant="muted" className="text-[12px]">
            Canonical zone id: {draft.zoneId || '—'}
          </Text>
          <Text variant="muted" className="text-[12px]">
            {pendingLocation && isLocationFresh(pendingLocation.timestamp)
              ? `GPS auto-attached · ${formatCoords(pendingLocation)} · ${new Date(pendingLocation.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit' })}`
              : 'Area zone selected — no fresh GPS'}
          </Text>
        </Row>
        {draft.photos.length ? (
          <Row label={`Photo evidence (${draft.photos.filter((photo) => photo.remoteUrl).length}/${draft.photos.length} uploaded)`}>
            <View className="flex-row flex-wrap gap-2 py-1">
              {draft.photos.map((photo) => (
                <View key={photo.id} className="relative h-20 w-20 overflow-hidden rounded-xl border border-border bg-card">
                  <Image source={{ uri: photo.remoteUrl ?? photo.localUri }} className="h-full w-full" />
                  {photo.uploading ? (
                    <View className="absolute inset-0 items-center justify-center bg-foreground/40">
                      <ActivityIndicator color="#fff" />
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
            {draft.photos.some((photo) => !photo.remoteUrl) ? (
              <Text variant="muted" className="text-[12px]">
                Photos still uploading are attached automatically once ready — wait before submitting.
              </Text>
            ) : null}
          </Row>
        ) : null}
        <Row label="Urgency" onEdit={busy ? undefined : () => router.push('/report-details')}>
          <Text className="text-[14px] font-bold">{urgencyLabel}</Text>
        </Row>
        <Pressable
          accessibilityRole="button" accessibilityLabel="Refresh GPS position"
          disabled={busy || refreshing} onPress={() => { void refreshGps(); }}
          className="flex-row items-center justify-center gap-2 rounded-2xl border border-border bg-card p-4">
          {refreshing ? <ActivityIndicator color={THEME.light.primary} /> : <LocateFixed size={18} color={THEME.light.primary} />}
          <Text className="font-semibold text-primary">{refreshing ? 'Refreshing GPS…' : 'Refresh GPS position'}</Text>
        </Pressable>
        {draft.voice && <>
          <Row label="Voice transcript — reference only">
            <Text selectable className="text-[13px] leading-5">{draft.voice.transcript}</Text>
            <Text className="mt-1 text-[11px] text-muted-foreground">Language: {draft.voice.languageCode ?? 'Not identified'}. Only the report fields above are submitted; the raw recording and this reference transcript are not attached.</Text>
          </Row>
          <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: confirmed, disabled: busy }} disabled={busy}
            onPress={() => setConfirmedRevision(confirmed ? null : getDraftRevision())} className="flex-row items-start gap-3 rounded-2xl border border-border bg-card p-4">
            <View className={`mt-0.5 size-6 items-center justify-center rounded-md border ${confirmed ? 'border-primary bg-primary' : 'border-border'}`}><Text className="font-bold text-white">{confirmed ? '✓' : ''}</Text></View>
            <Text className="flex-1 text-[13px] leading-5">I reviewed and corrected the category, description, venue zone and urgency. Submit these details as my report.</Text>
          </Pressable>
        </>}

        {error ? (
          <View className="gap-3">
            <Alert icon={TriangleAlert} variant="destructive">
              <AlertTitle>Couldn’t submit report</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onPress={submit} disabled={busy || !canSubmit} className="h-14 w-full rounded-2xl">
              <Text className="text-[15px] font-bold">
                {busy ? 'Sending report…' : 'Try Again'}
              </Text>
            </Button>
          </View>
        ) : (
          <PrimaryButton
            title={busy ? 'Sending report…' : 'Submit Report'}
            onPress={submit}
            loading={busy}
            disabled={!canSubmit}
          />
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
