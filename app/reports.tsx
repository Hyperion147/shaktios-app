import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { ReportCard } from '@/src/components/ReportCard';
import { EmptyState, ErrorState, LoadingState } from '@/src/components/States';
import { useSession } from '@/src/store/session';
import { eventsApi } from '@/src/api/events';
import { normalizeError } from '@/src/api/client';
import type { BackendIncident } from '@/src/types';

export default function ReportsScreen() {
  const router = useRouter();
  const { myReports } = useSession();
  const [incidents, setIncidents] = React.useState<BackendIncident[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setError(null);
    try {
      setIncidents(await eventsApi.getIncidents(10));
    } catch (e) {
      setError(normalizeError(e).message);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <ScreenContainer className="px-0">
      <ScrollView className="flex-1 px-5" contentContainerClassName="gap-4 pb-8">
        <View>
          <Pressable onPress={() => router.back()}>
            <Text className="text-sm text-muted-foreground">‹ Back</Text>
          </Pressable>
          <Text variant="h3" className="mt-1">My reports</Text>
        </View>

        {myReports.length === 0 ? (
          <EmptyState
            title="No reports yet"
            subtitle="Tap Report incident on the home screen to send your first observation."
          />
        ) : (
          myReports.map((r) => <ReportCard key={r.id} report={r} />)
        )}

        <Text className="mt-2 text-base font-bold">Live incidents at your zones</Text>
        <Text variant="muted">From the ShaktiOS backend — authority-owned status.</Text>
        {error ? (
          <ErrorState title="Could not load incidents" message={error} onRetry={load} />
        ) : incidents === null ? (
          <LoadingState title="Loading incidents…" />
        ) : incidents.length === 0 ? (
          <EmptyState title="No incidents" subtitle="Nothing correlated yet for recent signals." />
        ) : (
          incidents.map((i) => (
            <View key={i.id} className="rounded-xl border border-border bg-card p-4">
              <Text className="font-semibold">{i.type.replace(/_/g, ' ')} · {i.location}</Text>
              <Text variant="muted" className="text-xs">
                {i.status} · severity {i.severity} · risk {i.risk.toFixed(2)}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
