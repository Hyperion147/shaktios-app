import { Pressable, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { Card } from '@/src/components/Card';
import { useSession } from '@/src/store/session';
import { INCIDENT_CATEGORIES } from '@/src/constants/config';

export default function SubmittedScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { myReports } = useSession();
  const report = myReports.find((r) => r.id === id) ?? myReports[0];
  const label = report
    ? (INCIDENT_CATEGORIES.find((c) => c.id === report.category)?.label ?? report.category)
    : 'Report';

  return (
    <ScreenContainer className="justify-center gap-4">
      <View className="items-center gap-2">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-primary">
          <Text className="text-2xl font-bold text-primary-foreground">✓</Text>        </View>
        <Text variant="h3">Report submitted</Text>
        <Text variant="muted" className="text-center">
          Your report has been sent to the safety operations team.
        </Text>
      </View>

      {report ? (
        <Card>
          <Text variant="muted" className="text-xs uppercase">Report ID</Text>
          <Text className="font-mono text-sm">{report.id}</Text>
          <Text className="mt-2 font-semibold">{label}</Text>
          <Text variant="muted">
            {new Date(report.createdAt).toLocaleString()} · {report.locationLabel}
          </Text>
        </Card>
      ) : null}

      <Pressable onPress={() => router.replace('/home')} className="rounded-xl bg-primary py-4">
        <Text className="text-center font-bold text-primary-foreground">Back to home</Text>
      </Pressable>
      <Pressable onPress={() => router.replace('/reports')}>
        <Text className="text-center text-sm text-muted-foreground">View my reports</Text>
      </Pressable>
    </ScreenContainer>
  );
}
