import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { Card } from '@/src/components/Card';
import { MOCK_VENUE_EVENTS } from '@/src/constants/config';
import { useSession } from '@/src/store/session';

export default function JoinEventScreen() {
  const router = useRouter();
  const { joinEvent, activeEvent } = useSession();

  return (
    <ScreenContainer>
      <Pressable onPress={() => router.back()}>
        <Text className="text-sm text-muted-foreground">‹ Back</Text>
      </Pressable>
      <Text variant="h3" className="mt-2">Join event</Text>
      <Text variant="muted">Select the event you are attending, or scan its QR.</Text>

      <View className="mt-4 gap-3">
        {MOCK_VENUE_EVENTS.map((event) => {
          const active = activeEvent?.id === event.id;
          return (
            <Card key={event.id} className={active ? 'border-primary' : undefined}>
              <Text className="text-base font-bold">{event.name}</Text>
              {event.description ? <Text variant="muted">{event.description}</Text> : null}
              <Pressable
                onPress={() => {
                  joinEvent(event);
                  router.replace('/home');
                }}
                className={`mt-3 rounded-lg py-3 ${active ? 'bg-secondary' : 'bg-primary'}`}>
                <Text
                  className={`text-center font-semibold ${active ? '' : 'text-primary-foreground'}`}>
                  {active ? 'Current event ✓' : 'Join this event'}
                </Text>
              </Pressable>
            </Card>
          );
        })}
      </View>

      <Pressable onPress={() => router.push('/scan')} className="mt-4 rounded-lg border border-border py-3.5">
        <Text className="text-center font-semibold">Scan event QR instead</Text>
      </Pressable>
    </ScreenContainer>
  );
}
