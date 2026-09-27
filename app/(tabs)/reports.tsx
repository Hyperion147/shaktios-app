import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
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
import type { BackendEvent, IncidentCategoryId } from '@/src/types';

type Filter = 'all' | 'active' | 'resolved';
type DemoStatus = 'under_review' | 'received' | 'action_initiated' | 'resolved';

const STATUS_LABELS: Record<DemoStatus, string> = {
  under_review: 'Under review',
  received: 'Received',
  action_initiated: 'Action initiated',
  resolved: 'Resolved',
};

/**
 * Demo lifecycle mapping (hash of report id) until the backend exposes a
 * citizen-facing status. Deterministic so filters stay stable.
 */
export function demoStatus(id: string): DemoStatus {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const seq: DemoStatus[] = ['under_review', 'received', 'action_initiated', 'resolved'];
  return seq[h % seq.length];
}

function categoryOf(payload: Record<string, unknown>): IncidentCategoryId {
  const id = payload.category;
  return (
    INCIDENT_CATEGORIES.some((c) => c.id === id) ? (id as IncidentCategoryId) : 'other'
  );
}

function categoryLabel(id: unknown): string {
  return INCIDENT_CATEGORIES.find((c) => c.id === id)?.label ?? String(id ?? 'Report');
}

/** Screen 11 — My Reports with All / Active / Resolved filters. */
export default function ReportsScreen() {
  const router = useRouter();
  const [reports, setReports] = React.useState<BackendEvent[] | null>(null);
  const [filter, setFilter] = React.useState<Filter>('all');
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setError(null);
    try {
      setReports(await fetchMyReports());
    } catch (e) {
      const err = normalizeError(e);
      if (err.code === 'unauthorized') {
        router.replace('/login');
        return;
      }
      setError(err.message);
    }
  }, [router]);

  React.useEffect(() => {
    load();
  }, [load]);

  const visible = (reports ?? []).filter((r) => {
    const s = demoStatus(r.id);
    if (filter === 'all') return true;
    if (filter === 'resolved') return s === 'resolved';
    return s !== 'resolved';
  });

  return (
    <ScreenContainer className="px-0">
      <ScrollView className="flex-1 px-5" contentContainerClassName="gap-3 pb-8">
        <Text className="pt-2 text-[19px] font-extrabold tracking-tight">My Reports</Text>

        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList className="h-auto rounded-full bg-secondary/80 p-1">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'active', label: 'Active' },
                { id: 'resolved', label: 'Resolved' },
              ] as const
            ).map((t) => (
              <TabsTrigger
                key={t.id}
                value={t.id}
                className={cn('flex-1 rounded-full py-2.5', filter === t.id && 'bg-primary')}>
                <Text
                  className={cn(
                    'text-center text-[13px] font-bold',
                    filter === t.id ? 'text-primary-foreground' : 'text-muted-foreground',
                  )}>
                  {t.label}
                </Text>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {error ? (
          <View className="gap-3">
            <Alert icon={WifiOff} variant="destructive">
              <AlertTitle>Network Error</AlertTitle>
              <AlertDescription>
                {error}. Check your internet connection and try again.
              </AlertDescription>
            </Alert>
            <View className="flex-row gap-2">
              <Button onPress={load} className="h-12 flex-1 rounded-xl">
                <Text className="text-[14px] font-bold">Retry</Text>
              </Button>
              <Button onPress={() => router.back()} variant="outline" className="h-12 flex-1 rounded-xl">
                <Text className="text-[14px] font-semibold">Go Back</Text>
              </Button>
            </View>
          </View>
        ) : reports === null ? (
          <View className="gap-2">
            {[0, 1, 2].map((i) => (
              <View
                key={i}
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
            <Text className="text-center text-[15px] font-bold">No reports yet</Text>
            <Text variant="muted" className="text-center text-[12px]">
              {filter === 'all'
                ? 'Be the first to report from the Home tab.'
                : 'Nothing under this filter yet.'}
            </Text>
            <Pressable
              onPress={() => router.push('/report')}
              className="mt-2 rounded-2xl bg-primary px-6 py-3">
              <Text className="font-bold text-primary-foreground">Report Incident</Text>
            </Pressable>
          </View>
        ) : (
          visible.map((r) => {
            const payload = r.payload as Record<string, unknown>;
            const status = demoStatus(r.id);
            return (
              <Pressable
                key={r.id}
                onPress={() => router.push({ pathname: '/report-detail', params: { id: r.id } })}
                className="flex-row items-center gap-3 rounded-3xl border border-border bg-card p-4 active:opacity-80">
                <CategoryIcon id={categoryOf(payload)} size={44} />
                <View className="flex-1 gap-0.5">
                  <Text className="text-[13px] font-bold">{categoryLabel(payload.category)}</Text>
                  <Text className="text-[11px] text-muted-foreground">
                    TechFest 2025 · {timeAgo(r.timestamp)}
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
