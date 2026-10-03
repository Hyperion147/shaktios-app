import * as React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LocateFixed } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { PrimaryButton, ShaktiLogo } from '@/src/components/design';
import { useSession } from '@/src/store/session';
import { THEME } from '@/lib/theme';

/** One-time setup: location permission so reports carry accurate GPS automatically. */
export default function SetupLocationScreen() {
  const router = useRouter();
  const { requestSetupLocation, completeLocationSetup } = useSession();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const done = () => router.replace('/(tabs)/home');

  const allow = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await requestSetupLocation();
      done();
    } catch {
      setError('Could not access location. You can continue; reports will use the venue zone.');
    } finally {
      setBusy(false);
    }
  };

  const skip = async () => {
    if (busy) return;
    await completeLocationSetup(false);
    done();
  };

  return (
    <ScreenContainer className="items-center justify-center">
      <View className="flex-1 items-center justify-center gap-3 px-2">
        <ShaktiLogo size={64} />
        <View className="h-16 w-16 items-center justify-center rounded-full bg-[#EEEDFF]">
          <LocateFixed size={30} color={THEME.light.primary} />
        </View>
        <Text className="text-center text-[20px] font-extrabold">Share your location</Text>
        <Text className="text-center text-[13px] leading-5 text-muted-foreground">
          Accurate GPS is attached to your reports automatically, so responders
          reach the right spot. You will not be asked again for every report.
        </Text>
        {error ? <Text className="text-center text-[13px] text-destructive">{error}</Text> : null}
      </View>
      <View className="w-full gap-2 pb-4">
        {busy ? (
          <View className="flex-row items-center justify-center gap-2 py-3">
            <ActivityIndicator color={THEME.light.primary} />
            <Text className="text-[13px] text-muted-foreground">Capturing your position…</Text>
          </View>
        ) : null}
        <PrimaryButton title="Allow location" onPress={allow} loading={busy} />
        <PrimaryButton title="Skip for now" variant="ghost" disabled={busy} onPress={skip} />
      </View>
    </ScreenContainer>
  );
}
