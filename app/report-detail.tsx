import * as React from 'react';
import { ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CalendarDays, ImageIcon, MapPin } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import {
  CategoryIcon,
  PrimaryButton,
  ScreenHeader,
  StatusPill,
} from '@/src/components/design';
import { ErrorState, LoadingState } from '@/src/components/States';
import { fetchMyReports } from '@/src/api/reports';
import { normalizeError } from '@/src/api/client';
import { INCIDENT_CATEGORIES, venueEventName } from '@/src/constants/config';
import { THEME } from '@/lib/theme';
import type { BackendEvent, IncidentCategoryId } from '@/src/types';
import { demoStatus } from '@/app/(tabs)/reports';

/** Screen 12 — citizen-facing report detail. */
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
  const catId = INCIDENT_CATEGORIES.some((c) => c.id === payload.category)
    ? (payload.category as IncidentCategoryId)
    : 'other';
  const label =
    INCIDENT_CATEGORIES.find((c) => c.id === payload.category)?.label ?? 'Report';
  const status = demoStatus(report.id);
  const lat = payload.latitude as number | null;
  const lng = payload.longitude as number | null;
  const submitted = new Date(report.timestamp).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
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
          <CategoryIcon id={catId} size={48} />
          <View className="flex-1">
            <Text className="text-[15px] font-extrabold">{label}</Text>
          </View>
          <StatusPill
            status={status}
            label={status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
          />
        </Card>

        <Card className="gap-1.5 rounded-3xl p-4">
          <View className="flex-row justify-between">
            <Text className="text-[12px] text-muted-foreground">Report ID</Text>
            <Text className="font-mono text-[12px] font-bold">#SHK-2025-{report.id.slice(0, 4).toUpperCase()}</Text>
          </View>
          <View className="mt-1 flex-row justify-between">
            <Text className="text-[12px] text-muted-foreground">Event</Text>
            <Text className="text-[12px] font-bold">
              {venueEventName(payload.venue_event_id as string | undefined)}
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
            {String(payload.description || 'No description provided.')}
          </Text>
        </Card>

        <Card className="gap-1.5 rounded-3xl p-4">
          <View className="flex-row items-center gap-1.5">
            <MapPin size={14} color={THEME.light.primary} />
            <Text className="text-[13px] font-bold">Location</Text>
          </View>
          <Text className="text-[13px] font-semibold">
            {lat != null && lng != null
              ? `${lat.toFixed(4)}, ${lng.toFixed(4)} (±5 m)`
              : report.location}
          </Text>
          <Text variant="muted" className="text-[12px]">
            {submitted}
          </Text>
        </Card>

        <Card className="gap-2 rounded-3xl p-4">
          <View className="flex-row items-center gap-1.5">
            <ImageIcon size={14} color={THEME.light.primary} />
            <Text className="text-[13px] font-bold">Attachments</Text>
          </View>
          <View className="h-32 items-center justify-center overflow-hidden rounded-2xl bg-[#3B3B6B]">
            <Text className="text-[11px] text-white/80">1 image · venue photo</Text>
          </View>
        </Card>

        <PrimaryButton title="Back" onPress={() => router.back()} />
      </ScrollView>
    </ScreenContainer>
  );
}
