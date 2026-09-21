import * as React from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Text } from '@/components/ui/text';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { ErrorState, LoadingState } from '@/src/components/States';
import { useSession } from '@/src/store/session';
import { parseEventQr } from '@/src/utils/qr';

export default function ScanScreen() {
  const router = useRouter();
  const { validateEventId, joinEvent } = useSession();
  const [permission, requestPermission] = useCameraPermissions();
  const [error, setError] = React.useState<string | null>(null);
  const [locked, setLocked] = React.useState(false);

  const handleScan = ({ data }: { data: string }) => {
    if (locked) return;
    setLocked(true);
    try {
      const parsed = parseEventQr(data);
      const event = validateEventId(parsed.eventId);
      if (!event) {
        setError(`Unknown event "${parsed.eventId}". Ask the organizer for a valid QR.`);
        setLocked(false);
        return;
      }
      joinEvent(event);
      router.replace('/home');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid QR code.');
      setLocked(false);
    }
  };

  if (!permission) {
    return (
      <ScreenContainer>
        <LoadingState title="Preparing camera…" />
      </ScreenContainer>
    );
  }
  if (!permission.granted) {
    return (
      <ScreenContainer className="justify-center gap-4">
        <Text variant="h3" className="text-center">Camera needed</Text>
        <Text variant="muted" className="text-center">
          Allow camera access to scan the event QR code.
        </Text>
        <Pressable onPress={requestPermission} className="rounded-lg bg-primary py-3.5">
          <Text className="text-center font-semibold text-primary-foreground">Allow camera</Text>
        </Pressable>
        <Pressable onPress={() => router.back()}>
          <Text className="text-center text-sm text-muted-foreground">Go back</Text>
        </Pressable>
      </ScreenContainer>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={handleScan}
      />
      <View className="absolute inset-x-0 top-0 gap-2 bg-black/60 px-5 pb-4 pt-14">
        <Pressable onPress={() => router.back()}>
          <Text className="text-sm text-white/80">‹ Back</Text>
        </Pressable>
        <Text className="text-lg font-bold text-white">Point at the event QR</Text>
        {error ? (
          <ErrorState title="Invalid code" message={error} onRetry={() => setError(null)} />
        ) : null}
      </View>
    </View>
  );
}
