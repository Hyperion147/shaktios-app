import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Building2, CalendarDays, CheckCircle2, MapPin } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { PrimaryButton } from '@/src/components/design';
import { useSession } from '@/src/store/session';
import { ACTIVE_EVENT } from '@/src/constants/config';
import { THEME } from '@/lib/theme';

/** Screen 5 — confirmation shown right after joining an event. */
export default function EventJoinedScreen() {
  const router = useRouter();
  const { activeEvent } = useSession();
  const name = activeEvent?.name ?? 'TechFest 2025';

  return (
    <ScreenContainer>
      <View className="flex-1 items-center justify-center gap-2">
        <View className="relative items-center">
          <CheckCircle2 size={72} color={THEME.light.primary} fill="#EEEDFF" />
        </View>
        <Text className="mt-1 text-[20px] font-extrabold">Event Joined!</Text>

        <Card className="mt-3 w-full gap-3 rounded-3xl p-4">
          <View className="h-36 items-center justify-center gap-1 rounded-2xl bg-gradient-to-b bg-[#3B3B6B]">
            <Building2 size={44} color="#fff" />
            <Text className="text-[11px] text-white/80">{ACTIVE_EVENT.venue}</Text>
          </View>
          <Text className="text-[16px] font-extrabold">{name}</Text>
          <View className="flex-row items-center gap-1.5">
            <MapPin size={13} color={THEME.light.mutedForeground} />
            <Text variant="muted" className="text-[12px]">
              {ACTIVE_EVENT.venue}
            </Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <CalendarDays size={13} color={THEME.light.mutedForeground} />
            <Text variant="muted" className="text-[12px]">
              {ACTIVE_EVENT.dates}
            </Text>
          </View>
          <View className="flex-row items-center gap-2 rounded-2xl bg-[#DFF7E8] p-3">
            <CheckCircle2 size={16} color="#1E7F4D" />
            <Text className="text-[12px] font-semibold text-[#1E7F4D]">
              You're now part of this event.
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
