import * as React from 'react';
import { Image, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { TriangleAlert } from 'lucide-react-native';
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
import { formatCoords } from '@/src/utils/location';

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Card className="gap-1 rounded-2xl p-4">
      <Text className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </Text>
      {children}
    </Card>
  );
}

/** Screen 9 — Review report before submitting. */
export default function ReviewScreen() {
  const router = useRouter();
  const { draft, activeEvent, pendingLocation, addReport, setDraft } = useSession();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  // Synchronous in-flight guard: `busy` alone can't stop rapid double-taps
  // because state updates flush asynchronously. The ref flips synchronously,
  // so a second tap while the POST is in flight is a no-op. Reset in
  // `finally` so genuine failures remain retryable.
  const submittingRef = React.useRef(false);

  const categoryLabel =
    INCIDENT_CATEGORIES.find((c) => c.id === draft.category)?.label ?? draft.category;
  const urgencyLabel = draft.urgency.charAt(0).toUpperCase() + draft.urgency.slice(1);

  const submit = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setBusy(true);
    setError(null);
    try {
      const event = await submitReport({
        category: draft.category,
        description: draft.description,
        locationLabel: draft.locationLabel,
        latitude: pendingLocation?.latitude ?? null,
        longitude: pendingLocation?.longitude ?? null,
        accuracy: pendingLocation?.accuracy ?? null,
        eventId: activeEvent?.id ?? null,
        urgency: draft.urgency === 'high' ? 'high' : 'normal',
      });
      addReport({
        id: event.id,
        eventId: activeEvent?.id ?? null,
        category: draft.category,
        description: draft.description,
        location: pendingLocation,
        locationLabel: draft.locationLabel,
        urgency: draft.urgency === 'high' ? 'high' : 'normal',
        createdAt: event.timestamp,
        status: 'submitted',
        backendEventId: event.id,
      });
      setDraft({ description: '', photoUri: null });
      router.replace({ pathname: '/submitted', params: { id: event.id } });
    } catch (e) {
      const err = normalizeError(e);
      if (err.code === 'unauthorized') {
        router.replace('/login');
        return;
      }
      setError(err.message);
    } finally {
      submittingRef.current = false;
      setBusy(false);
    }
  };

  return (
    <ScreenContainer className="px-0">
      <View className="px-5">
        <ScreenHeader title="Review Report" onBack={() => router.back()} />
        <Stepper steps={['Category', 'Details', 'Location', 'Review']} current={3} />
      </View>
      <ScrollView className="flex-1 px-5" contentContainerClassName="gap-3 pb-6">
        <Row label="Event">
          <Text className="text-[14px] font-bold">{activeEvent?.name ?? 'TechFest 2025'}</Text>
        </Row>
        <Row label="Category">
          <Text className="text-[14px] font-bold">{categoryLabel}</Text>
        </Row>
        <Row label="Description">
          <Text className="text-[13px] leading-5">
            {draft.description || 'No description provided.'}
          </Text>
        </Row>
        <Row label="Location">
          <Text className="text-[14px] font-bold">{draft.locationLabel || '—'}</Text>
          <Text variant="muted" className="text-[12px]">
            {pendingLocation
              ? `${formatCoords(pendingLocation)} · ${new Date(pendingLocation.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit' })}`
              : 'Area name only — no GPS attached'}
          </Text>
        </Row>
        <Row label="Urgency">
          <Text className="text-[14px] font-bold">🟡 {urgencyLabel}</Text>
        </Row>
        <Row label="Attachments">
          {draft.photoUri ? (
            <Image
              source={{ uri: draft.photoUri }}
              className="h-28 w-full rounded-xl"
              resizeMode="cover"
            />
          ) : (
            <Text variant="muted" className="text-[12px]">
              No media attached
            </Text>
          )}
        </Row>

        {error ? (
          <View className="gap-3">
            <Alert icon={TriangleAlert} variant="destructive">
              <AlertTitle>Couldn't submit report</AlertTitle>
              <AlertDescription>
                {error} — check your connection and try again.
              </AlertDescription>
            </Alert>
            <Button onPress={submit} disabled={busy} className="h-14 w-full rounded-2xl">
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
          />
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
