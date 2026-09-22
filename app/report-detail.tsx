import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { Card, StatusBadge } from '@/src/components/Card';
import { ErrorState, LoadingState } from '@/src/components/States';
import { fetchMyReports } from '@/src/api/reports';
import { normalizeError } from '@/src/api/client';
import { INCIDENT_CATEGORIES, venueEventName } from '@/src/constants/config';
import { timeAgo } from '@/src/utils/time';
import type { BackendEvent } from '@/src/types';

function row(label: string, value: string) {
  return (
    <Card key={label}>
      <Text variant="muted" className="text-xs uppercase">{label}</Text>
      <Text className="mt-0.5 font-semibold">{value}</Text>
    </Card>
  );
}

/** Citizen-facing detail — observation facts only, no risk internals. */
export default function ReportDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [report, setReport] = React.useState<BackendEvent | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setError(null);
    try {
      const list = await fetchMyReports(50);
      setReport(list.find((e) => e.id === id) ?? null);
    } catch (e) {
      setError(normalizeError(e).message);
    }
  }, [id]);

  React.useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <ScreenContainer>
        <ErrorState title="Couldn't load report" message={error} onRetry={load} />
      </ScreenContainer>
    );
  }
  if (report === null) {
    return (
      <ScreenContainer>
        <LoadingState title="Loading report…" />
      </ScreenContainer>
    );
  }

  const payload = report.payload as Record<string, unknown>;
  const label =
    INCIDENT_CATEGORIES.find((c) => c.id === payload.category)?.label ??
    String(payload.category ?? 'Report');

  return (
    <ScreenContainer className="px-0">
      <ScrollView className="flex-1 px-5" contentContainerClassName="gap-3 pb-8">
        <Pressable onPress={() => router.back()}>
          <Text className="text-sm text-muted-foreground">‹ Back</Text>
        </Pressable>
        <View className="flex-row items-center justify-between gap-2">
          <Text className="flex-1 text-xl font-extrabold tracking-tight">{label}</Text>
          <StatusBadge status="received" />
        </View>
        {row('Description', String(payload.description || 'No description'))}
        {row('Location', report.location)}
        {row('Reported', `${timeAgo(report.timestamp)} (${new Date(report.timestamp).toLocaleString()})`)}
        {row('Event', venueEventName(payload.venue_event_id as string | undefined))}
        {row('Urgency', (payload.urgency as string) === 'high' ? 'Urgent' : 'Normal')}
        {row('Report ID', report.id)}
      </ScrollView>
    </ScreenContainer>
  );
}
