import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Building2, CalendarDays, Headset, MapPin } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { EmptyState } from '@/src/components/States';
import { ScreenHeader } from '@/src/components/design';
import { VenueState } from '@/src/components/VenueState';
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

/** Event information from the currently selected server venue. */
export default function EventInfoScreen() {
  const router = useRouter();
  const { activeEvent, leaveEvent } = useSession();
  const [confirmLeave, setConfirmLeave] = React.useState(false);

  const doLeave = () => {
    leaveEvent();
    setConfirmLeave(false);
    router.back();
  };

  return (
    <ScreenContainer className="px-0">
      <View className="px-5">
        <ScreenHeader title="Event Information" onBack={() => router.back()} />
      </View>
      <View className="px-5"><VenueState /></View>
      {!activeEvent ? (
        <View className="flex-1 px-5 pt-4">
          <EmptyState
            title="No event selected"
            subtitle="Join an event to see its venue information."
            action={
              <Pressable
                onPress={() => router.push('/(tabs)/scan')}
                className="mt-2 rounded-2xl bg-primary px-6 py-3">
                <Text className="font-bold text-primary-foreground">Join an event</Text>
              </Pressable>
            }
          />
        </View>
      ) : (
        <ScrollView className="flex-1 px-5" contentContainerClassName="gap-4 pb-8">
          <View className="h-44 items-center justify-center gap-1 overflow-hidden rounded-3xl bg-[#3B3B6B]">
            <Building2 size={52} color="#fff" />
            <Text className="text-[11px] text-white/80">{activeEvent.venue}</Text>
          </View>

          <View>
            <Text className="text-[17px] font-extrabold">{activeEvent.name}</Text>
            <View className="mt-1 flex-row items-center gap-1.5">
              <MapPin size={13} color={THEME.light.mutedForeground} />
              <Text variant="muted" className="text-[12px]">
                {activeEvent.venue}
              </Text>
            </View>
            {dates(activeEvent.startTime, activeEvent.endTime) ? (
              <View className="mt-0.5 flex-row items-center gap-1.5">
                <CalendarDays size={13} color={THEME.light.mutedForeground} />
                <Text variant="muted" className="text-[12px]">
                  {dates(activeEvent.startTime, activeEvent.endTime)}
                </Text>
              </View>
            ) : null}
          </View>

          {activeEvent.description ? (
            <View className="gap-1.5">
              <Text className="text-[14px] font-bold">About</Text>
              <Text className="text-[13px] leading-5 text-muted-foreground">
                {activeEvent.description}
              </Text>
            </View>
          ) : null}

          <View className="gap-2">
            <Text className="text-[14px] font-bold">Venue zones</Text>
            {activeEvent.zones.length ? (
              activeEvent.zones.map((zone) => (
                <View
                  key={zone.id}
                  className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-3.5">
                  <MapPin size={18} color={THEME.light.primary} />
                  <View className="flex-1">
                    <Text className="text-[13px] font-semibold">{zone.label}</Text>
                    <Text variant="muted" className="text-[11px]">
                      {zone.id}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text variant="muted" className="text-[12px]">
                No zones provided by the organizer.
              </Text>
            )}
          </View>

          <View className="gap-2">
            <Text className="text-[14px] font-bold">Emergency contact</Text>
            <View className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-3.5">
              <View className="rounded-full bg-[#EEEDFF] p-2">
                <Headset size={18} color={THEME.light.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-[13px] font-semibold">Event helpline</Text>
                <Text variant="muted" className="text-[12px]">
                  {activeEvent.helpline ?? 'No helpline provided by the organizer.'}
                </Text>
              </View>
            </View>
          </View>

          <Pressable
            onPress={() => setConfirmLeave(true)}
            className="rounded-2xl border border-destructive/40 py-3.5">
            <Text className="text-center text-[14px] font-bold text-destructive">Leave Event</Text>
          </Pressable>
        </ScrollView>
      )}

      <AlertDialog open={confirmLeave} onOpenChange={setConfirmLeave}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave this event?</AlertDialogTitle>
            <AlertDialogDescription>
              New reports will require another event and zone selection.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              <Text>Stay</Text>
            </AlertDialogCancel>
            <AlertDialogAction onPress={doLeave} className="bg-destructive">
              <Text className="text-destructive-foreground">Leave Event</Text>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ScreenContainer>
  );
}
