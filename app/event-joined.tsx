import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Building2, CalendarDays, CheckCircle2, MapPin } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { EmptyState } from '@/src/components/States';
import { PrimaryButton } from '@/src/components/design';
import { useSession } from '@/src/store/session';
import { THEME } from '@/lib/theme';

function dates(startTime: string | null, endTime: string | null): string | null {
  const format = (value: string | null) =>
    value
      ? new Date(value).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : null;
  const start = format(startTime);
  const end = format(endTime);
  return start && end ? `${start} – ${end}` : (start ?? end);
}

export default function EventJoinedScreen() {
  const router = useRouter();
  const { activeEvent } = useSession();

  if (!activeEvent) {
    return (
      <ScreenContainer>
        <EmptyState
          title="Event unavailable"
          subtitle="The selected event could not be restored."
          action={
            <PrimaryButton title="Choose an event" onPress={() => router.replace('/(tabs)/scan')} />
          }
        />
      </ScreenContainer>
    );
  }

  const eventDates = dates(activeEvent.startTime, activeEvent.endTime);
  return (
    <ScreenContainer>
      <View className="flex-1 items-center justify-center gap-2">
        <CheckCircle2 size={72} color={THEME.light.primary} fill="#EEEDFF" />
        <Text className="mt-1 text-[20px] font-extrabold">Event joined</Text>
        <Card className="mt-3 w-full gap-3 rounded-3xl p-4">
          <View className="h-36 items-center justify-center gap-1 rounded-2xl bg-[#3B3B6B]">
            <Building2 size={44} color="#fff" />
            <Text className="text-[11px] text-white/80">{activeEvent.venue}</Text>
          </View>
          <Text className="text-[16px] font-extrabold">{activeEvent.name}</Text>
          <View className="flex-row items-center gap-1.5">
            <MapPin size={13} color={THEME.light.mutedForeground} />
            <Text variant="muted" className="text-[12px]">
              {activeEvent.venue}
            </Text>
          </View>
          {eventDates ? (
            <View className="flex-row items-center gap-1.5">
              <CalendarDays size={13} color={THEME.light.mutedForeground} />
              <Text variant="muted" className="text-[12px]">
                {eventDates}
              </Text>
            </View>
          ) : null}
          <View className="flex-row items-center gap-2 rounded-2xl bg-[#DFF7E8] p-3">
            <CheckCircle2 size={16} color="#176B43" />
            <Text className="text-[12px] font-semibold text-[#176B43]">
              This venue is ready for zone-based reports.
            </Text>
          </View>
        </Card>
      </View>
      <View className="gap-2 pb-2">
        <PrimaryButton title="Go to Home" onPress={() => router.replace('/(tabs)/home')} />
        <Pressable onPress={() => router.push('/event-info')} className="py-2">
          <Text className="text-center text-[13px] font-semibold text-primary">
            View Event Details
          </Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
