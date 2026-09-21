import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { Card } from '@/src/components/Card';
import { EmptyState } from '@/src/components/States';
import { ReportCard } from '@/src/components/ReportCard';
import { useSession } from '@/src/store/session';

export default function HomeScreen() {
  const router = useRouter();
  const { user, activeEvent, myReports } = useSession();

  return (
    <ScreenContainer className="px-0">
      <ScrollView className="flex-1 px-5" contentContainerClassName="gap-4 pb-8">
        <View className="pt-2">
          <Text variant="muted">Namaste{user?.name ? `, ${user.name}` : ''}</Text>
          <Text variant="h3">Report an incident</Text>
        </View>

        {activeEvent ? (
          <Card>
            <Text variant="muted" className="text-xs uppercase">Active event</Text>
            <Text className="mt-0.5 text-lg font-bold">{activeEvent.name}</Text>
            {activeEvent.description ? <Text variant="muted">{activeEvent.description}</Text> : null}
            <Pressable onPress={() => router.push('/join')} className="mt-2">
              <Text className="text-sm font-medium text-primary-foreground underline">Switch event</Text>
            </Pressable>
          </Card>
        ) : (
          <Card>
            <Text className="font-semibold">No event joined</Text>
            <Text variant="muted">Join the event you are attending so reports carry context.</Text>
            <View className="mt-3 flex-row gap-2">
              <Pressable onPress={() => router.push('/scan')} className="flex-1 rounded-lg bg-primary py-3">
                <Text className="text-center font-semibold text-primary-foreground">Scan event QR</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push('/join')}
                className="flex-1 rounded-lg border border-border py-3">
                <Text className="text-center font-semibold">Choose event</Text>
              </Pressable>
            </View>
          </Card>
        )}

        <Pressable
          onPress={() => router.push('/report')}
          className="rounded-2xl bg-destructive py-5 active:opacity-90">
          <Text className="text-center text-lg font-bold text-white">Report incident</Text>
          <Text className="text-center text-sm text-white/80">Takes under 30 seconds</Text>
        </Pressable>

        <View className="flex-row items-center justify-between">
          <Text className="text-base font-bold">My recent reports</Text>
          <Pressable onPress={() => router.push('/reports')}>
            <Text className="text-sm text-muted-foreground">View all</Text>
          </Pressable>
        </View>

        {myReports.length === 0 ? (
          <EmptyState
            title="No reports yet"
            subtitle="Reports you submit will appear here with their status."
          />
        ) : (
          myReports.slice(0, 3).map((r) => <ReportCard key={r.id} report={r} />)
        )}

        <View className="flex-row gap-2">
          <Pressable
            onPress={() => router.push('/reports')}
            className="flex-1 rounded-lg border border-border py-3">
            <Text className="text-center font-medium">My reports</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/profile')}
            className="flex-1 rounded-lg border border-border py-3">
            <Text className="text-center font-medium">Profile</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
