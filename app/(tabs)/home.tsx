import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight, CircleUserRound, Clock, MapPin, Siren } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { Card } from '@/src/components/Card';
import { THEME } from '@/lib/theme';
import { useSession } from '@/src/store/session';

export default function HomeScreen() {
  const router = useRouter();
  const { user, activeEvent } = useSession();

  return (
    <ScreenContainer className="px-0">
      <ScrollView className="flex-1 px-5" contentContainerClassName="gap-4 pb-8">
        <View className="flex-row items-center justify-between pt-2">
          <View>
            <Text className="text-xl font-extrabold tracking-tight">ShaktiOS</Text>
            <Text variant="muted">Hello{user?.name ? `, ${user.name}` : ' and welcome'}</Text>
          </View>
          <Pressable
            onPress={() => router.push('/(tabs)/profile')}
            accessibilityLabel="Open profile"
            className="rounded-full border border-border p-2.5">
            <CircleUserRound size={22} color={THEME.light.foreground} />
          </Pressable>
        </View>

        <Card>
          <Text variant="muted" className="text-xs font-semibold uppercase tracking-wider">
            You are attending
          </Text>
          <Text className="mt-1 text-xl font-extrabold tracking-tight">
            {(activeEvent?.name ?? 'Riverfest 2026').toUpperCase()}
          </Text>
          <View className="mt-1 inline-flex items-center self-start rounded-full bg-secondary px-2.5 py-1">
            <Text className="text-xs font-semibold text-secondary-foreground">Active Event</Text>
          </View>
          <View className="mt-3 gap-1.5">
            <View className="flex-row items-center gap-2">
              <MapPin size={15} color={THEME.light.mutedForeground} />
              <Text variant="muted" className="mt-0">
                {activeEvent?.description?.split('—')[0]?.trim() || 'Event Venue'}
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Clock size={15} color={THEME.light.mutedForeground} />
              <Text variant="muted" className="mt-0">
                Today
              </Text>
            </View>
          </View>
        </Card>

        <Pressable
          onPress={() => router.push('/report')}
          accessibilityRole="button"
          accessibilityLabel="Report an incident"
          className="items-center gap-1 rounded-2xl bg-destructive py-6 active:opacity-90">
          <View className="flex-row items-center gap-2">
            <Siren size={24} color={THEME.light.destructiveForeground} />
            <Text className="text-xl font-extrabold text-destructive-foreground">
              Report Incident
            </Text>
          </View>
          <Text className="text-sm text-destructive-foreground/80">
            Something happened? Report it here.
          </Text>
        </Pressable>

        <View className="gap-2">
          <Pressable
            onPress={() => router.push('/(tabs)/reports')}
            className="flex-row items-center justify-between rounded-xl border border-border bg-card px-4 py-4">
            <Text className="font-semibold">My Reports</Text>
            <ChevronRight size={18} color={THEME.light.mutedForeground} />
          </Pressable>
          <Pressable
            onPress={() => router.push('/(tabs)/join')}
            className="flex-row items-center justify-between rounded-xl border border-border bg-card px-4 py-4">
            <Text className="font-semibold">Event Information</Text>
            <ChevronRight size={18} color={THEME.light.mutedForeground} />
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

