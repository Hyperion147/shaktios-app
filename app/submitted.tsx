import { Pressable, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Send } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { PrimaryButton } from '@/src/components/design';
import { useSession } from '@/src/store/session';
import { INCIDENT_CATEGORIES, venueEventName } from '@/src/constants/config';

/** Screen 10 — submission success. */
export default function SubmittedScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { myReports, activeEvent } = useSession();
  const report = myReports.find((r) => r.id === id) ?? myReports[0];
  const label = report
    ? (INCIDENT_CATEGORIES.find((c) => c.id === report.category)?.label ?? report.category)
    : 'Report';

  const submittedAt = report
    ? new Date(report.createdAt).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
      })
    : '';

  return (
    <ScreenContainer>
      <View className="flex-1 items-center justify-center gap-2">
        <View className="relative items-center justify-center">
          <View className="absolute h-28 w-28 rounded-full bg-[#EEEDFF]" />
          <View className="absolute h-20 w-20 rounded-full bg-[#E0DEFF]" />
          <Send size={44} color="#6468F0" />
        </View>
        <Text className="mt-2 text-[20px] font-extrabold">Report Submitted!</Text>
        <Text variant="muted" className="text-center text-[13px] leading-5">
          Your report has been sent to the{'\n'}ShaktiOS system. Authorities will{'\n'}review it
          shortly.
        </Text>

        {report ? (
          <Card className="mt-3 w-full gap-2 rounded-3xl p-4">
            <View>
              <Text className="text-[11px] text-muted-foreground">Report ID</Text>
              <Text className="font-mono text-[13px] font-bold">#{report.id.slice(0, 13)}</Text>
            </View>
            <View>
              <Text className="text-[11px] text-muted-foreground">Category</Text>
              <Text className="text-[13px] font-bold">{label}</Text>
            </View>
            <View>
              <Text className="text-[11px] text-muted-foreground">Event</Text>
              <Text className="text-[13px] font-bold">
                {venueEventName(activeEvent?.id ?? report.eventId)}
              </Text>
            </View>
            <View>
              <Text className="text-[11px] text-muted-foreground">Submitted</Text>
              <Text className="text-[13px] font-bold">{submittedAt}</Text>
            </View>
          </Card>
        ) : null}
      </View>

      <View className="gap-1 pb-2">
        <PrimaryButton title="View My Reports" onPress={() => router.replace('/(tabs)/reports')} />
        <Pressable onPress={() => router.replace('/(tabs)/home')} className="py-2">
          <Text className="text-center text-[13px] font-semibold text-primary">Back to Home</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
