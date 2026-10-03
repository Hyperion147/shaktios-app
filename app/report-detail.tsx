import * as React from 'react';
import { Image, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusedResource } from '@/src/hooks/useFocusedResource';
import { CalendarDays, MapPin } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { CategoryIcon, ScreenHeader, StatusPill } from '@/src/components/design';
import { ErrorState, LoadingState } from '@/src/components/States';
import { fetchMyReport } from '@/src/api/reports';
import { normalizeError } from '@/src/api/client';
import { INCIDENT_CATEGORIES } from '@/src/constants/config';
import { THEME } from '@/lib/theme';
import type { CitizenReportRecord, IncidentCategoryId } from '@/src/types';

function reportErrorMessage(error: ReturnType<typeof normalizeError>): string {
  if (error.status === 404)
    return 'This report was not found or is not owned by the signed-in account.';
  if (error.code === 'unauthorized') {
    return 'The server rejected the current session. Retry once; if it persists, sign out and sign in again.';
  }
  return error.message;
}

/** Citizen report detail; reloads from the ownership-filtered endpoint on focus. */
export default function ReportDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const readReport = React.useCallback((signal: AbortSignal) => {
    if (typeof id !== 'string' || !id) return Promise.reject(new Error('No report id was provided.'));
    return fetchMyReport(id, signal);
  }, [id]);
  const { data: report, loading, error, reload: load } = useFocusedResource(readReport, reportErrorMessage);

  if (loading) {
    return (
      <ScreenContainer>
        <LoadingState title="Loading report…" />
      </ScreenContainer>
    );
  }
  if (error || !report) {
    return (
      <ScreenContainer>
        <ErrorState
          title="Couldn’t load report"
          message={error ?? 'Report is unavailable.'}
          onRetry={load}
        />
      </ScreenContainer>
    );
  }

  const payload = report.payload as Record<string, unknown>;
  const categoryId = INCIDENT_CATEGORIES.some((item) => item.id === payload.category)
    ? (payload.category as IncidentCategoryId)
    : 'other';
  const categoryLabel =
    INCIDENT_CATEGORIES.find((item) => item.id === payload.category)?.label ?? 'Report';
  const latitude = typeof payload.latitude === 'number' ? payload.latitude : null;
  const longitude = typeof payload.longitude === 'number' ? payload.longitude : null;
  const locationLabel =
    typeof payload.location_label === 'string' ? payload.location_label : report.location;
  const photoUrls = Array.isArray(payload.photo_urls)
    ? payload.photo_urls.filter((url): url is string => typeof url === 'string' && url.startsWith('http')).slice(0, 3)
    : [];
  const submitted = new Date(report.timestamp).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <ScreenContainer className="px-0">
      <View className="px-5">
        <ScreenHeader title="Report Details" onBack={() => router.back()} />
      </View>
      <ScrollView className="flex-1 px-5" contentContainerClassName="gap-3 pb-6">
        <Card className="flex-row items-center gap-3 rounded-3xl p-4">
          <CategoryIcon id={categoryId} size={48} />
          <View className="flex-1">
            <Text className="text-[15px] font-extrabold">{categoryLabel}</Text>
          </View>
          <StatusPill status={report.report_status} />
        </Card>

        <Card className="gap-1.5 rounded-3xl p-4">
          <View className="flex-row justify-between">
            <Text className="text-[12px] text-muted-foreground">Report ID</Text>
            <Text className="max-w-[65%] text-right font-mono text-[12px] font-bold">
              {report.id}
            </Text>
          </View>
          <View className="mt-1 flex-row justify-between">
            <Text className="text-[12px] text-muted-foreground">Event</Text>
            <Text className="max-w-[65%] text-right text-[12px] font-bold">
              {report.venue_name ?? 'Event unavailable'}
            </Text>
          </View>
          <View className="mt-1 flex-row justify-between">
            <View className="flex-row items-center gap-1">
              <CalendarDays size={12} color={THEME.light.mutedForeground} />
              <Text className="text-[12px] text-muted-foreground">Submitted</Text>
            </View>
            <Text className="text-[12px] font-bold">{submitted}</Text>
          </View>
        </Card>

        <Card className="gap-1.5 rounded-3xl p-4">
          <Text className="text-[13px] font-bold">Description</Text>
          <Text className="text-[13px] leading-5 text-muted-foreground">
            {typeof payload.description === 'string' && payload.description
              ? payload.description
              : 'No description provided.'}
          </Text>
        </Card>

        <Card className="gap-1.5 rounded-3xl p-4">
          <View className="flex-row items-center gap-1.5">
            <MapPin size={14} color={THEME.light.primary} />
            <Text className="text-[13px] font-bold">Location</Text>
          </View>
          <Text className="text-[13px] font-semibold">{locationLabel}</Text>
          <Text variant="muted" className="text-[12px]">
            Canonical zone id: {report.location}
          </Text>
          {latitude != null && longitude != null ? (
            <Text variant="muted" className="text-[12px]">
              GPS: {latitude.toFixed(4)}, {longitude.toFixed(4)}
            </Text>
          ) : (
            <Text variant="muted" className="text-[12px]">
              No GPS coordinates attached.
            </Text>
          )}
        </Card>

        {photoUrls.length ? (
          <Card className="gap-1.5 rounded-3xl p-4">
            <Text className="text-[13px] font-bold">Photo evidence</Text>
            <View className="flex-row flex-wrap gap-2 py-1">
              {photoUrls.map((url) => (
                <Image key={url} source={{ uri: url }} className="h-24 w-24 rounded-xl border border-border bg-card" />
              ))}
            </View>
          </Card>
        ) : null}

        {report.incident_id ? (
          <Card className="gap-1.5 rounded-3xl p-4">
            <Text className="text-[13px] font-bold">Incident status</Text>
            <Text className="text-[13px] text-muted-foreground">
              {report.incident_status ?? 'Not available'}
            </Text>
          </Card>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}
