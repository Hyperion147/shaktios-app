import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Building2, CalendarDays, Headset, MapPin, ShieldAlert } from 'lucide-react-native';
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
import { ScreenHeader } from '@/src/components/design';
import { useSession } from '@/src/store/session';
import { ACTIVE_EVENT } from '@/src/constants/config';
import { THEME } from '@/lib/theme';

/** Screen 17 — Event Information with about + emergency contacts + leave. */
export default function EventInfoScreen() {
  const router = useRouter();
  const { activeEvent, leaveEvent } = useSession();
  const [confirmLeave, setConfirmLeave] = React.useState(false);
  const name = activeEvent?.name ?? 'TechFest 2025';

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
      <ScrollView className="flex-1 px-5" contentContainerClassName="gap-4 pb-8">
        <View className="h-44 items-center justify-center gap-1 overflow-hidden rounded-3xl bg-[#3B3B6B]">
          <Building2 size={52} color="#fff" />
          <Text className="text-[11px] text-white/80">Main venue · Evening view</Text>
        </View>

        <View>
          <Text className="text-[17px] font-extrabold">{name}</Text>
          <View className="mt-1 flex-row items-center gap-1.5">
            <MapPin size={13} color={THEME.light.mutedForeground} />
            <Text variant="muted" className="text-[12px]">
              {ACTIVE_EVENT.venue}
            </Text>
          </View>
          <View className="mt-0.5 flex-row items-center gap-1.5">
            <CalendarDays size={13} color={THEME.light.mutedForeground} />
            <Text variant="muted" className="text-[12px]">
              {ACTIVE_EVENT.dates}
            </Text>
          </View>
        </View>

        <View className="gap-1.5">
          <Text className="text-[14px] font-bold">About</Text>
          <Text className="text-[13px] leading-5 text-muted-foreground">{ACTIVE_EVENT.about}</Text>
        </View>

        <View className="gap-2">
          <Text className="text-[14px] font-bold">Emergency Contacts</Text>
          <View className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-3.5">
            <View className="rounded-full bg-[#EEEDFF] p-2">
              <Headset size={18} color={THEME.light.primary} />
            </View>
            <View className="flex-1">
              <Text className="text-[13px] font-semibold">Event Helpline</Text>
              <Text variant="muted" className="text-[12px]">
                24×7 on-ground support
              </Text>
            </View>
            <Text className="text-[13px] font-bold">+91 98765 43210</Text>
          </View>
          <View className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-3.5">
            <View className="rounded-full bg-[#FFE9E9] p-2">
              <ShieldAlert size={18} color="#E5484D" />
            </View>
            <View className="flex-1">
              <Text className="text-[13px] font-semibold">Police Control Room</Text>
              <Text variant="muted" className="text-[12px]">
                Emergency response
              </Text>
            </View>
            <Text className="text-[13px] font-bold">112</Text>
          </View>
        </View>

        {activeEvent ? (
          <Pressable
            onPress={() => setConfirmLeave(true)}
            className="rounded-2xl border border-destructive/40 py-3.5">
            <Text className="text-center text-[14px] font-bold text-destructive">Leave Event</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => router.push('/(tabs)/scan')}
            className="rounded-2xl bg-primary py-4">
            <Text className="text-center text-[14px] font-bold text-primary-foreground">
              Join this event
            </Text>
          </Pressable>
        )}
      </ScrollView>

      <AlertDialog open={confirmLeave} onOpenChange={setConfirmLeave}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave this event?</AlertDialogTitle>
            <AlertDialogDescription>
              New reports will be filed without an event until you join another one.
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
