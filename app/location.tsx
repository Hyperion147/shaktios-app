import * as React from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { CheckCircle2, LocateFixed, MapPin } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { PrimaryButton, ScreenHeader } from '@/src/components/design';
import { useSession } from '@/src/store/session';
import { captureLocation, type LocationState } from '@/src/utils/location';
import { THEME } from '@/lib/theme';

/** Optional device GPS evidence, not a decorative map or invented accuracy. */
export default function LocationScreen() {
  const router = useRouter();
  const { pendingLocation, setPendingLocation, draft, getDraftRevision } = useSession();
  const [state, setState] = React.useState<LocationState>(
    pendingLocation ? { status: 'ready', location: pendingLocation } : { status: 'idle' },
  );
  const [linkError, setLinkError] = React.useState<string | null>(null);
  const inFlight = React.useRef(false);
  const mounted = React.useRef(true);

  const requestRevision = React.useRef(0);
  useFocusEffect(React.useCallback(() => {
    mounted.current = true;
    setState({ status: 'idle' });
    return () => { mounted.current = false; ++requestRevision.current; inFlight.current = false; };
  }, []));

  const request = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    const requestId = ++requestRevision.current;
    const revision = getDraftRevision();
    const current = () => mounted.current && requestId === requestRevision.current && revision === getDraftRevision();
    setState({ status: 'requesting' });
    try {
      const location = await captureLocation();
      if (!current()) return;
      setPendingLocation(location);
      setState({ status: 'ready', location });
    } catch (error) {
      if (!current()) return;
      const message = error instanceof Error ? error.message : 'Location unavailable.';
      setState({ status: message.toLowerCase().includes('denied') ? 'denied' : 'unavailable', message });
      setPendingLocation(null);
    } finally {
      if (requestId === requestRevision.current) {
        inFlight.current = false;
        if (mounted.current) setState((value) => value.status === 'requesting' ? { status: 'idle' } : value);
      }
    }
  };

  const loc = pendingLocation;
  const openMap = async () => {
    if (!loc) return;
    setLinkError(null);
    try {
      await Linking.openURL(`https://www.openstreetmap.org/?mlat=${loc.latitude}&mlon=${loc.longitude}#map=17/${loc.latitude}/${loc.longitude}`);
    } catch { setLinkError('Could not open the map. Your coordinates are shown below.'); }
  };
  const next = () => router.push('/review');

  return (
    <ScreenContainer className="px-0">
      <View className="px-5"><ScreenHeader title="Location" onBack={() => router.back()} /></View>
      <ScrollView className="flex-1 px-5" contentContainerClassName="gap-4 pb-6">
        <View className="gap-3 rounded-3xl border border-border bg-card p-5">
          <MapPin size={28} color={THEME.light.primary} />
          <Text className="text-[17px] font-bold">{draft.locationLabel || 'No zone selected'}</Text>
          <Text className="text-[13px] leading-5 text-muted-foreground">Your selected venue zone identifies the report location. You can optionally attach your current GPS position as additional evidence.</Text>
          {loc && <Pressable accessibilityRole="link" onPress={openMap} className="self-start rounded-xl bg-primary/10 px-4 py-3"><Text className="font-semibold text-primary">View captured position on a map</Text></Pressable>}
        </View>
        {loc && <View className="gap-3 rounded-2xl border border-border bg-card p-4">
          <View className="flex-row items-center gap-2"><CheckCircle2 size={18} color={THEME.light.primary} /><Text className="font-bold">GPS position captured</Text></View>
          {[
            ['Latitude', loc.latitude.toFixed(6)],
            ['Longitude', loc.longitude.toFixed(6)],
            ['Accuracy', loc.accuracy != null ? `± ${Math.round(loc.accuracy)} m` : 'Not provided by device'],
            ['Captured', new Date(loc.timestamp).toLocaleString()],
          ].map(([label, value]) => <View key={label} className="flex-row flex-wrap justify-between gap-2"><Text className="text-[12px] text-muted-foreground">{label}</Text><Text className="text-[12px] font-semibold">{value}</Text></View>)}
          <Pressable accessibilityRole="button" onPress={() => { setPendingLocation(null); setState({ status: 'idle' }); }}><Text className="text-[12px] text-destructive">Remove GPS position</Text></Pressable>
        </View>}
        {'message' in state && <Text accessibilityRole="alert" className="text-[13px] text-destructive">{state.message} You can continue with your selected venue zone.</Text>}
        {linkError && <Text accessibilityRole="alert" className="text-[13px] text-destructive">{linkError}</Text>}
        {state.status === 'requesting' ? <View className="flex-row items-center gap-2 p-3"><ActivityIndicator color={THEME.light.primary} /><Text>Capturing GPS position…</Text></View> : <Pressable accessibilityRole="button" onPress={request} className="flex-row items-center justify-center gap-2 rounded-2xl border border-border bg-card p-4"><LocateFixed size={18} color={THEME.light.primary} /><Text className="font-semibold text-primary">{loc ? 'Refresh GPS position' : 'Capture GPS position'}</Text></Pressable>}
        {state.status === 'denied' && Platform.OS !== 'web' && <Pressable accessibilityRole="button" className="min-h-12 justify-center" onPress={() => { void Linking.openSettings().catch(() => setLinkError('Open device settings to allow location access, or continue with your venue zone.')); }}><Text className="text-center font-semibold text-primary">Open location settings</Text></Pressable>}
        <PrimaryButton title={loc ? 'Continue with GPS' : 'Continue with zone only'} onPress={next} disabled={state.status === 'requesting' || !draft.zoneId} />
      </ScrollView>
    </ScreenContainer>
  );
}
