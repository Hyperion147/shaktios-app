import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { Card } from '@/src/components/Card';
import { MOCK_VENUE_EVENTS } from '@/src/constants/config';
import { useSession } from '@/src/store/session';

/** Events tab — pick the attended event (QR/deep-link fills the same slot). */
export default function JoinEventScreen() {
  const router = useRouter();
  const { joinEvent, activeEvent } = useSession();

  return (
    <ScreenContainer className="px-0">
      <ScrollView className="flex-1 px-5" contentContainerClassName="gap-3 pb-8">
        <View className="pt-2">
          <Text className="text-xl font-extrabold tracking-tight">Events</Text>
          <Text variant="muted">Choose the event you are attending.</Text>
        </View>

        {MOCK_VENUE_EVENTS.map((event) => {
          const active = activeEvent?.id === event.id;
          return (
            <Card key={event.id} className={active ? 'border-primary' : undefined}>
              <Text className="text-base font-bold">{event.name}</Text>
              {event.description ? <Text variant="muted">{event.description}</Text> : null}
              <Pressable
                onPress={() => {
                  joinEvent(event);
                  router.push('/(tabs)/home');
                }}
                className={`mt-3 rounded-lg py-3 ${active ? 'bg-secondary' : 'bg-primary'}`}>
                <Text
                  className={`text-center font-semibold ${active ? 'text-secondary-foreground' : 'text-primary-foreground'}`}>
                  {active ? 'Current event ✓' : 'Join this event'}
                </Text>
              </Pressable>
            </Card>
          );
        })}

        <Pressable
          onPress={() => router.push('/scan')}
          className="rounded-lg border border-border py-3.5">
          <Text className="text-center font-semibold">Scan event QR instead</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}
