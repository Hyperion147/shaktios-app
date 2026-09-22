import { Pressable, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { Card } from '@/src/components/Card';
import { useSession } from '@/src/store/session';
import { INCIDENT_CATEGORIES, venueEventName } from '@/src/constants/config';

export default function SubmittedScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { myReports, activeEvent } = useSession();
  const report = myReports.find((r) => r.id === id) ?? myReports[0];
  const label = report
    ? (INCIDENT_CATEGORIES.find((c) => c.id === report.category)?.label ?? report.category)
    : 'Report';

  return (
    <ScreenContainer className="justify-center gap-4">
      <View className="items-center gap-2">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-primary">
          <Text className="text-2xl font-bold text-primary-foreground">✓</Text>
        </View>
        <Text className="text-xl font-extrabold tracking-tight">Report Submitted</Text>
        <Text variant="muted" className="text-center">
          Your report has been received by ShaktiOS.
        </Text>
      </View>

      {report ? (
        <Card>
          <Text variant="muted" className="text-xs uppercase">Report ID</Text>
          <Text className="font-mono text-sm">{report.id}</Text>
          <Text className="mt-2 font-semibold">{label}</Text>
          <Text variant="muted">
            {venueEventName(activeEvent?.id)} · {report.locationLabel}
          </Text>
        </Card>
      ) : null}

      <View className="gap-2 rounded-xl border border-border bg-card p-4">
        <Text className="font-semibold">✓ Report received</Text>
        <Text variant="muted" className="mt-0">✓ ShaktiOS is processing the report</Text>
      </View>

      <Pressable onPress={() => router.replace('/(tabs)/home')} className="rounded-xl bg-primary py-4">
        <Text className="text-center font-bold text-primary-foreground">Back to home</Text>
      </Pressable>
      <Pressable onPress={() => router.replace('/(tabs)/reports')}>
        <Text className="text-center text-sm text-muted-foreground">View reports</Text>
      </Pressable>
    </ScreenContainer>
  );
}
