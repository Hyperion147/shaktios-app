import * as React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Camera } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { PrimaryButton } from '@/src/components/design';
import { useSession, newPhotoId } from '@/src/store/session';
import { MAX_EVIDENCE_PHOTOS, captureEvidencePhoto } from '@/src/api/evidence';
import { THEME } from '@/lib/theme';

/** Quick-capture entry: opens the camera, attaches the photo, starts the report flow. */
export default function ClickScreen() {
  const router = useRouter();
  const { draft, addDraftPhotos } = useSession();
  const [error, setError] = React.useState<string | null>(null);
  const [launching, setLaunching] = React.useState(false);
  const draftRef = React.useRef(draft);
  draftRef.current = draft;
  const inFlight = React.useRef(false);

  const launch = React.useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setLaunching(true);
    setError(null);
    try {
      const remaining = MAX_EVIDENCE_PHOTOS - draftRef.current.photos.length;
      if (remaining <= 0) {
        router.push('/report');
        return;
      }
      const localUri = await captureEvidencePhoto('camera', remaining);
      if (!localUri) {
        router.replace('/(tabs)/home');
        return;
      }
      addDraftPhotos([{ id: newPhotoId(), localUri, remoteUrl: null, uploading: false, error: null }]);
      router.push('/report');
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Could not open the camera.');
    } finally {
      inFlight.current = false;
      setLaunching(false);
    }
  }, [addDraftPhotos, router]);

  useFocusEffect(React.useCallback(() => {
    void launch();
  }, [launch]));

  return (
    <ScreenContainer className="items-center justify-center">
      <View className="flex-1 items-center justify-center gap-3 px-6">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-[#EEEDFF]">
          <Camera size={30} color={THEME.light.primary} />
        </View>
        <Text className="text-center text-[18px] font-extrabold">
          {launching ? 'Opening camera…' : 'Click a picture'}
        </Text>
        {launching ? <ActivityIndicator color={THEME.light.primary} /> : null}
        {error ? <Text className="text-center text-[13px] text-destructive">{error}</Text> : null}
      </View>
      <View className="w-full gap-2 pb-4">
        {!launching ? <PrimaryButton title="Open camera" onPress={() => { void launch(); }} /> : null}
        <PrimaryButton title="Continue without photo" variant="outline" disabled={launching} onPress={() => router.replace('/report')} />
      </View>
    </ScreenContainer>
  );
}
