import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { Card, StatusBadge } from '@/src/components/Card';
import { ErrorState, LoadingState } from '@/src/components/States';
import { useSession } from '@/src/store/session';
import { eventsApi } from '@/src/api/events';
import { normalizeError } from '@/src/api/client';
import { INCIDENT_CATEGORIES } from '@/src/constants/config';
import { formatCoords } from '@/src/utils/location';
import type { BackendIncident } from '@/src/types';

export default function ReportDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { myReports } = useSession();
  const report = myReports.find((r) => r.id === id);
  const [incident, setIncident] = React.useState<BackendIncident | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!report?.backendEventId) return;
    // Best-effort: find a correlated incident sharing the zone label.
    setLoading(true);
    eventsApi
      .getIncidents(50)
      .then((list) => setIncident(list.find((i) => i.location === report.locationLabel) ?? null))
      .catch((e) => setError(normalizeError(e).message))
      .finally(() => setLoading(false));
  }, [report]);

  if (!report) {
    return (
      <ScreenContainer>
        <Text variant="h3">Report not found</Text>
        <Pressable onPress={() => router.back()} className="mt-4">
          <Text className="text-muted-foreground">‹ Back</Text>
        </Pressable>
      </ScreenContainer>
    );
  }

  const label = INCIDENT_CATEGORIES.find((c) => c.id === report.category)?.label ?? report.category;

  return (
    <ScreenContainer className="px-0">
      <ScrollView className="flex-1 px-5" contentContainerClassName="gap-3 pb-8">
        <Pressable onPress={() => router.back()}>
          <Text className="text-sm text-muted-foreground">‹ Back</Text>
        </Pressable>
        <View className="flex-row items-center justify-between">
          <Text variant="h3">{label}</Text>
          <StatusBadge status={report.status} />
        </View>

        <Card>
          <Text variant="muted" className="text-xs uppercase">Description</Text>
          <Text>{report.description || 'No description'}</Text>
        </Card>
        <Card>
          <Text variant="muted" className="text-xs uppercase">Report ID</Text>
          <Text className="font-mono text-xs">{report.id}</Text>
          <Text variant="muted" className="mt-1 text-xs">
            {new Date(report.createdAt).toLocaleString()} · {report.locationLabel}
            {report.location ? ` · ${formatCoords(report.location)}` : ''}
          </Text>
        </Card>

        <Text className="mt-1 text-base font-bold">Backend status</Text>
        {loading ? (
          <LoadingState title="Checking for a correlated incident…" />
        ) : error ? (
          <ErrorState title="Could not check status" message={error} />
        ) : incident ? (
          <Card>
            <Text className="font-semibold">
              {incident.type.replace(/_/g, ' ')} · {incident.location}
            </Text>
            <Text variant="muted" className="text-xs">
              {incident.status} · severity {incident.severity} · risk {incident.risk.toFixed(2)}
            </Text>
          </Card>
        ) : (
          <Text variant="muted">No correlated incident yet — check back after the pipeline runs.</Text>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
