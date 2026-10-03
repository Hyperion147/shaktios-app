import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { WifiOff } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { CategoryIcon, StatusPill } from '@/src/components/design';
import { fetchMyReports } from '@/src/api/reports';
import { normalizeError } from '@/src/api/client';
import { INCIDENT_CATEGORIES } from '@/src/constants/config';
import { timeAgo } from '@/src/utils/time';
import { cn } from '@/lib/utils';
import type { CitizenReportRecord, IncidentCategoryId, ReportStatus } from '@/src/types';

type Filter = 'all' | 'active' | 'resolved';

const STATUS_LABELS: Record<ReportStatus, string> = {
  submitted: 'Submitted',
  received: 'Received',
  under_review: 'Under review',
  action_initiated: 'Action initiated',
  resolved: 'Resolved',
};

function categoryOf(payload: Record<string, unknown>): IncidentCategoryId {
  return INCIDENT_CATEGORIES.some((item) => item.id === payload.category)
    ? (payload.category as IncidentCategoryId)
    : 'other';
}

function categoryLabel(id: unknown): string {
  return INCIDENT_CATEGORIES.find((item) => item.id === id)?.label ?? 'Report';
}

function authErrorMessage(error: ReturnType<typeof normalizeError>): string {
  return error.code === 'unauthorized'
    ? 'The server rejected the current session. Retry once; if it persists, sign out and sign in again.'
    : error.message;
}

export default function ReportsScreen() {
  const router = useRouter();
  const [reports, setReports] = React.useState<CitizenReportRecord[] | null>(null);
  const [filter, setFilter] = React.useState<Filter>('all');
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setError(null);
    try {
      setReports(await fetchMyReports(50, 0));
    } catch (e) {
      setError(authErrorMessage(normalizeError(e)));
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      void load();
    }, [load])
  );

  const visible = (reports ?? []).filter((report) => {
    if (filter === 'all') return true;
    if (filter === 'resolved') return report.report_status === 'resolved';
    return report.report_status !== 'resolved';
  });

  return (
    <ScreenContainer className="px-0">
      <ScrollView className="flex-1 px-5" contentContainerClassName="gap-3 pb-8">
        <Text className="pt-2 text-[19px] font-extrabold tracking-tight">My Reports</Text>

        <Tabs value={filter} onValueChange={(value) => setFilter(value as Filter)}>
          <TabsList className="h-auto rounded-full bg-secondary/80 p-1">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'active', label: 'Active' },
                { id: 'resolved', label: 'Resolved' },
              ] as const
            ).map((item) => (
              <TabsTrigger
                key={item.id}
                value={item.id}
                className={cn('flex-1 rounded-full py-2.5', filter === item.id && 'bg-primary')}>
                <Text
                  className={cn(
                    'text-center text-[13px] font-bold',
                    filter === item.id ? 'text-primary-foreground' : 'text-muted-foreground'
                  )}>
                  {item.label}
                </Text>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {error ? (
          <View className="gap-3">
            <Alert icon={WifiOff} variant="destructive">
              <AlertTitle>Couldn’t load reports</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onPress={load} className="h-12 rounded-xl">
              <Text className="text-[14px] font-bold">Retry</Text>
            </Button>
          </View>
        ) : reports === null ? (
          <View className="gap-2">
            {[0, 1, 2].map((item) => (
              <View
                key={item}
                className="flex-row items-center gap-3 rounded-3xl border border-border bg-card p-4">
                <Skeleton className="h-11 w-11 rounded-full" />
                <View className="flex-1 gap-1.5">
                  <Skeleton className="h-3.5 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </View>
                <Skeleton className="h-6 w-20 rounded-full" />
              </View>
            ))}
          </View>
        ) : visible.length === 0 ? (
          <View className="items-center gap-2 rounded-3xl border border-border bg-card px-6 py-10">
            <Text className="text-center text-[15px] font-bold">
              {filter === 'all' ? 'No reports yet' : `No ${filter} reports`}
            </Text>
            <Text variant="muted" className="text-center text-[12px]">
              {filter === 'all'
                ? 'Reports you submit will appear here.'
                : 'Nothing under this filter yet.'}
            </Text>
            <Pressable
              onPress={() => router.push('/report')}
              className="mt-2 rounded-2xl bg-primary px-6 py-3">
              <Text className="font-bold text-primary-foreground">Report Incident</Text>
            </Pressable>
          </View>
        ) : (
          visible.map((report) => {
            const payload = report.payload as Record<string, unknown>;
            const status = report.report_status;
            return (
              <Pressable
                key={report.id}
                onPress={() =>
                  router.push({ pathname: '/report-detail', params: { id: report.id } })
                }
                className="flex-row items-center gap-3 rounded-3xl border border-border bg-card p-4 active:opacity-80">
                <CategoryIcon id={categoryOf(payload)} size={44} />
                <View className="flex-1 gap-0.5">
                  <Text className="text-[13px] font-bold">{categoryLabel(payload.category)}</Text>
                  <Text className="text-[11px] text-muted-foreground">
                    {report.venue_name ?? 'Event unavailable'} · {timeAgo(report.timestamp)}
                  </Text>
                </View>
                <StatusPill status={status} label={STATUS_LABELS[status]} />
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
