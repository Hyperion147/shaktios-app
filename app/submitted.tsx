import * as React from 'react';
import { Pressable, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Send } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { PrimaryButton } from '@/src/components/design';
import { ErrorState, LoadingState } from '@/src/components/States';
import { fetchMyReport } from '@/src/api/reports';
import { normalizeError } from '@/src/api/client';
import { INCIDENT_CATEGORIES } from '@/src/constants/config';
import type { CitizenReportRecord } from '@/src/types';

export default function SubmittedScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [report, setReport] = React.useState<CitizenReportRecord | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!id) {
      setError('The submitted report id is missing.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setReport(await fetchMyReport(id));
    } catch (e) {
      setError(normalizeError(e).message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    void load();
  }, [load]);

  if (loading)
    return (
      <ScreenContainer>
        <LoadingState title="Saving your report…" />
      </ScreenContainer>
    );
  if (error || !report) {
    return (
      <ScreenContainer>
        <ErrorState
          title="Couldn’t load submitted report"
          message={error ?? 'Report is unavailable.'}
          onRetry={load}
        />
      </ScreenContainer>
    );
  }

  const payload = report.payload as Record<string, unknown>;
  const category =
    INCIDENT_CATEGORIES.find((item) => item.id === payload.category)?.label ?? 'Report';
  const submittedAt = new Date(report.timestamp).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <ScreenContainer>
      <View className="flex-1 items-center justify-center gap-2">
        <View className="relative items-center justify-center">
          <View className="absolute h-28 w-28 rounded-full bg-[#EEEDFF]" />
          <View className="absolute h-20 w-20 rounded-full bg-[#E0DEFF]" />
          <Send size={44} color="#6468F0" />
        </View>
        <Text className="mt-2 text-[20px] font-extrabold">Report submitted</Text>
        <Text variant="muted" className="text-center text-[13px] leading-5">
          Your report was stored by the ShaktiOS system.
        </Text>

        <Card className="mt-3 w-full gap-2 rounded-3xl p-4">
          <View>
            <Text className="text-[11px] text-muted-foreground">Report ID</Text>
            <Text className="font-mono text-[13px] font-bold">{report.id}</Text>
          </View>
          <View>
            <Text className="text-[11px] text-muted-foreground">Category</Text>
            <Text className="text-[13px] font-bold">{category}</Text>
          </View>
          <View>
            <Text className="text-[11px] text-muted-foreground">Event</Text>
            <Text className="text-[13px] font-bold">
              {report.venue_name ?? 'Event unavailable'}
            </Text>
          </View>
          <View>
            <Text className="text-[11px] text-muted-foreground">Status</Text>
            <Text className="text-[13px] font-bold">{report.report_status}</Text>
          </View>
          <View>
            <Text className="text-[11px] text-muted-foreground">Submitted</Text>
            <Text className="text-[13px] font-bold">{submittedAt}</Text>
          </View>
        </Card>
      </View>

      <View className="gap-1 pb-2">
        <PrimaryButton
          title="View Report Details"
          onPress={() => router.replace({ pathname: '/report-detail', params: { id: report.id } })}
        />
        <Pressable onPress={() => router.replace('/(tabs)/home')} className="py-2">
          <Text className="text-center text-[13px] font-semibold text-primary">Back to Home</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
