import * as React from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { CheckCircle2, LocateFixed, MapPin } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { PrimaryButton, ScreenHeader } from '@/src/components/design';
import { useSession } from '@/src/store/session';
import { captureLocation, type LocationState } from '@/src/utils/location';
import { THEME } from '@/lib/theme';

/** Stylized map placeholder: streets + accuracy radius + pin. */
function MapPlaceholder({ captured }: { captured: boolean }) {
  return (
    <View className="relative h-72 overflow-hidden rounded-3xl bg-[#E8EBF1]">
      {/* streets */}
      <View className="absolute left-0 top-10 h-3 w-full bg-white/90" />
      <View className="absolute left-0 top-40 h-4 w-full bg-white/90" />
      <View className="absolute left-8 top-0 h-full w-3 bg-white/90" />
      <View className="absolute right-16 top-0 h-full w-4 bg-white/90" />
      <View className="absolute left-0 top-24 h-2 w-full rotate-6 bg-white/70" />
      {/* blocks */}
      <View className="absolute left-16 top-16 h-10 w-20 rounded bg-[#DDE1E9]" />
      <View className="absolute bottom-10 right-8 h-12 w-24 rounded bg-[#DDE1E9]" />
      <View className="absolute bottom-16 left-14 h-8 w-14 rounded bg-[#DDE1E9]" />
      {/* accuracy radius + pin */}
      {captured ? (
        <View className="absolute inset-0 items-center justify-center">
          <View className="h-36 w-36 items-center justify-center rounded-full bg-primary/15">
            <View className="h-24 w-24 items-center justify-center rounded-full bg-primary/25">
              <View className="h-5 w-5 rounded-full border-[3px] border-white bg-primary" />
            </View>
          </View>
        </View>
      ) : (
        <View className="absolute inset-0 items-center justify-center">
          <MapPin size={40} color={THEME.light.mutedForeground} />
          <Text variant="muted" className="mt-1 text-[12px]">
            Waiting for location…
          </Text>
        </View>
      )}
      {/* recenter */}
      <View className="absolute bottom-3 right-3 rounded-full bg-white p-2.5 shadow">
        <LocateFixed size={18} color={THEME.light.foreground} />
      </View>
    </View>
  );
}

/** Screen 8 — Location capture with GPS fix + details grid. */
export default function LocationScreen() {
  const router = useRouter();
  const { pendingLocation, setPendingLocation } = useSession();
  const [state, setState] = React.useState<LocationState>(
    pendingLocation ? { status: 'ready', location: pendingLocation } : { status: 'idle' },
  );

  const request = React.useCallback(async () => {
    setState({ status: 'requesting' });
    try {
      const location = await captureLocation();
      setState({ status: 'ready', location });
      setPendingLocation(location);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Location unavailable.';
      setState({
        status: message.includes('denied') ? 'denied' : 'unavailable',
        message,
      });
      setPendingLocation(null);
    }
  }, [setPendingLocation]);

  React.useEffect(() => {
    if (!pendingLocation) request();
  }, [request, pendingLocation]);

  const loc = state.status === 'ready' ? state.location : pendingLocation;
  const takenAt = loc ? new Date(loc.timestamp) : null;

  const cells: [string, string][] = [
    ['Latitude', loc ? loc.latitude.toFixed(4) : '—'],
    ['Longitude', loc ? loc.longitude.toFixed(4) : '—'],
    ['Accuracy', loc?.accuracy != null ? `± ${Math.round(loc.accuracy)} m` : '—'],
    [
      'Time',
      takenAt
        ? takenAt.toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            hour: 'numeric',
            minute: '2-digit',
          })
        : '—',
    ],
  ];

  return (
    <ScreenContainer className="px-0">
      <View className="px-5">
        <ScreenHeader title="Location" onBack={() => router.back()} />
      </View>
      <ScrollView className="flex-1 px-5" contentContainerClassName="gap-4 pb-6">
        <MapPlaceholder captured={!!loc} />

        <View className="gap-2">
          <Text className="text-[13px] font-bold">Location Details</Text>
          <View className="flex-row flex-wrap gap-2">
            {cells.map(([label, value]) => (
              <View key={label} className="min-w-[46%] flex-1 gap-0.5 rounded-2xl bg-secondary/70 p-3">
                <Text className="text-[11px] text-muted-foreground">{label}</Text>
                <Text className="text-[14px] font-bold">{value}</Text>
              </View>
            ))}
          </View>
        </View>

        {state.status === 'requesting' ? (
          <View className="flex-row items-center gap-2 rounded-2xl bg-secondary/70 p-3.5">
            <ActivityIndicator color={THEME.light.primary} />
            <Text className="text-[12px] font-semibold">Capturing your location…</Text>
          </View>
        ) : loc ? (
          <View className="flex-row items-center gap-2 rounded-2xl bg-[#DFF7E8] p-3.5">
            <CheckCircle2 size={18} color="#1E7F4D" />
            <Text className="text-[12px] font-bold text-[#1E7F4D]">
              Location captured successfully
            </Text>
          </View>
        ) : (
          <View className="gap-2 rounded-2xl border border-border bg-card p-4">
            <Text className="text-[13px] font-bold">
              {state.status === 'denied' ? 'Location Permission' : 'Location unavailable'}
            </Text>
            <Text variant="muted" className="text-[12px]">
              {state.status === 'denied'
                ? 'Location permission is required to report incidents. You can still continue with the area name.'
                : 'message' in state
                  ? state.message
                  : 'Could not get your GPS fix. You can still continue with the area name.'}
            </Text>
            <View className="mt-1 flex-row gap-2">
              {state.status === 'denied' ? (
                <Pressable
                  onPress={() => Linking.openSettings()}
                  className="flex-1 rounded-xl bg-primary py-3">
                  <Text className="text-center text-[13px] font-bold text-primary-foreground">
                    Open Settings
                  </Text>
                </Pressable>
              ) : (
                <Pressable onPress={request} className="flex-1 rounded-xl bg-primary py-3">
                  <Text className="text-center text-[13px] font-bold text-primary-foreground">
                    Retry
                  </Text>
                </Pressable>
              )}
              <Pressable
                onPress={() => router.push('/review')}
                className="flex-1 rounded-xl border border-border py-3">
                <Text className="text-center text-[13px] font-semibold text-muted-foreground">
                  Continue anyway
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        <PrimaryButton title="Next" onPress={() => router.push('/review')} />
      </ScrollView>
    </ScreenContainer>
  );
}
