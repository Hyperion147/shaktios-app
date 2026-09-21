import * as React from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { Card } from '@/src/components/Card';
import { ErrorState } from '@/src/components/States';
import { useSession } from '@/src/store/session';
import { submitReport } from '@/src/api/reports';
import { normalizeError } from '@/src/api/client';
import { INCIDENT_CATEGORIES } from '@/src/constants/config';
import { formatCoords } from '@/src/utils/location';

export default function ReviewScreen() {
  const router = useRouter();
  const { draft, activeEvent, pendingLocation, addReport, setDraft } = useSession();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const categoryLabel =
    INCIDENT_CATEGORIES.find((c) => c.id === draft.category)?.label ?? draft.category;

  const submit = async () => {
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
        urgency: draft.urgency,
      });
      addReport({
        id: event.id,
        eventId: activeEvent?.id ?? null,
        category: draft.category,
        description: draft.description,
        location: pendingLocation,
        locationLabel: draft.locationLabel,
        urgency: draft.urgency,
        createdAt: event.timestamp,
        status: 'submitted',
        backendEventId: event.id,
      });
      setDraft({ description: '' });
      router.replace({ pathname: '/submitted', params: { id: event.id } });
    } catch (e) {
      setError(normalizeError(e).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenContainer>
      <Pressable onPress={() => router.back()}>
        <Text className="text-sm text-muted-foreground">‹ Back</Text>
      </Pressable>
      <Text variant="h3" className="mt-2">Review report</Text>
      <Text variant="muted">This goes to ShaktiOS as a raw observation.</Text>

      <View className="mt-4 gap-3">
        <Card>
          <Text variant="muted" className="text-xs uppercase">Event</Text>
          <Text className="font-semibold">{activeEvent?.name ?? 'No event joined'}</Text>
        </Card>
        <Card>
          <Text variant="muted" className="text-xs uppercase">Category</Text>
          <Text className="font-semibold">{categoryLabel}</Text>
          {draft.description ? <Text className="mt-1">{draft.description}</Text> : null}
        </Card>
        <Card>
          <Text variant="muted" className="text-xs uppercase">Location</Text>
          <Text className="font-semibold">{draft.locationLabel || '—'}</Text>
          <Text variant="muted">
            {pendingLocation ? formatCoords(pendingLocation) : 'GPS not attached — zone label only'}
          </Text>
        </Card>
      </View>

      {error ? (
        <View className="mt-4">
          <ErrorState title="Could not submit" message={error} onRetry={submit} />
        </View>
      ) : null}

      <Pressable onPress={submit} disabled={busy} className="mt-6 rounded-xl bg-destructive py-4 disabled:opacity-50">
        <Text className="text-center text-base font-bold text-white">
          {busy ? 'Submitting…' : 'Submit to ShaktiOS'}
        </Text>
      </Pressable>
    </ScreenContainer>
  );
}
