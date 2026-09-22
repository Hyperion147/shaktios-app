import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { StatusBadge } from '@/src/components/Card';
import { EmptyState, ErrorState, LoadingState } from '@/src/components/States';
import { fetchRecentReports } from '@/src/api/reports';
import { normalizeError } from '@/src/api/client';
import { INCIDENT_CATEGORIES, venueEventName } from '@/src/constants/config';
import { timeAgo } from '@/src/utils/time';
import type { BackendEvent } from '@/src/types';

function categoryLabel(id: unknown): string {
  return INCIDENT_CATEGORIES.find((c) => c.id === id)?.label ?? String(id ?? 'Report');
}

/** Recent citizen reports from GET /events (no per-user identity on backend yet). */
export default function ReportsScreen() {
  const router = useRouter();
  const [reports, setReports] = React.useState<BackendEvent[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setError(null);
    try {
      setReports(await fetchRecentReports());
    } catch (e) {
      setError(normalizeError(e).message);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <ScreenContainer className="px-0">
      <ScrollView className="flex-1 px-5" contentContainerClassName="gap-3 pb-8">
        <View className="pt-2">
          <Text className="text-xl font-extrabold tracking-tight">Recent Reports</Text>
          <Text variant="muted">Latest citizen observations received by ShaktiOS.</Text>
        </View>

        {error ? (
          <ErrorState title="Couldn't load reports" message={error} onRetry={load} />
        ) : reports === null ? (
          <LoadingState title="Loading reports…" />
        ) : reports.length === 0 ? (
          <EmptyState
            title="No reports yet"
            subtitle="Be the first to report from the Home tab."
          />
        ) : (
          reports.map((r) => {
            const payload = r.payload as Record<string, unknown>;
            return (
              <Pressable
                key={r.id}
                onPress={() => router.push({ pathname: '/report-detail', params: { id: r.id } })}
                className="rounded-xl border border-border bg-card p-4 active:opacity-80">
                <View className="flex-row items-center justify-between gap-2">
                  <Text className="flex-1 font-bold">{categoryLabel(payload.category)}</Text>
                  <StatusBadge status="received" />
                </View>
                <Text variant="muted" className="mt-1">
                  {venueEventName(payload.venue_event_id as string | undefined)}
                </Text>
                <Text variant="muted" className="text-xs">
                  {timeAgo(r.timestamp)} · {r.location}
                </Text>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
