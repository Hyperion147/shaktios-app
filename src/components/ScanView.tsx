import * as React from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { CheckCircle2, QrCode } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { InfoNote, ScreenHeader } from '@/src/components/design';
import { useSession } from '@/src/store/session';
import { parseEventQr } from '@/src/utils/qr';
import { ACTIVE_EVENT, MOCK_VENUE_EVENTS } from '@/src/constants/config';
import { THEME } from '@/lib/theme';
import { cn } from '@/lib/utils';
import type { VenueEvent } from '@/src/types';

/** Screens 4 + 15 — Join Event with Scan QR / Select Event tabs and success sheet. */
export function ScanView() {
  const router = useRouter();
  const { joinEvent, validateEventId, activeEvent } = useSession();
  const [tab, setTab] = React.useState<'scan' | 'select'>('scan');
  const [cameraOpen, setCameraOpen] = React.useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [code, setCode] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [found, setFound] = React.useState<VenueEvent | null>(null);
  const [locked, setLocked] = React.useState(false);

  const resolve = React.useCallback(
    (raw: string): boolean => {
      try {
        const parsed = parseEventQr(raw);
        const event = validateEventId(parsed.eventId);
        if (!event) {
          setError(`Unknown event "${parsed.eventId}". Ask the organizer for a valid QR.`);
          return false;
        }
        setError(null);
        setFound(event);
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Invalid QR code.');
        return false;
      }
    },
    [validateEventId],
  );

  const handleBarcode = ({ data }: { data: string }) => {
    if (locked) return;
    setLocked(true);
    const ok = resolve(data);
    if (ok) setCameraOpen(false);
    else setLocked(false);
  };

  const submitCode = () => {
    if (!code.trim()) {
      setError('Enter the event code printed near the QR.');
      return;
    }
    resolve(code.trim());
  };

  const confirmJoin = () => {
    if (!found) return;
    joinEvent(found);
    setFound(null);
    setCode('');
    router.push('/event-joined');
  };

  return (
    <ScreenContainer className="px-0">
      <View className="px-5">
        <ScreenHeader title="Join Event" onBack={() => router.back()} />
      </View>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as 'scan' | 'select')}>
        <TabsList className="mx-5 my-3 h-auto rounded-2xl bg-secondary/80 p-1.5">
          {(
            [
              { id: 'scan', label: 'Scan QR' },
              { id: 'select', label: 'Select Event' },
            ] as const
          ).map((t) => (
            <TabsTrigger
              key={t.id}
              value={t.id}
              className={cn('flex-1 rounded-2xl py-3', tab === t.id && 'bg-primary')}>
              <Text
                className={cn(
                  'text-center text-[14px] font-bold',
                  tab === t.id ? 'text-primary-foreground' : 'text-muted-foreground',
                )}>
                {t.label}
              </Text>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {tab === 'scan' ? (
        <View className="flex-1 gap-3 px-5 pb-6">
          {cameraOpen && permission?.granted ? (
            <View className="h-80 overflow-hidden rounded-3xl bg-foreground">
              <CameraView
                style={{ flex: 1 }}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={handleBarcode}
              />
            </View>
          ) : (
            <Pressable
              onPress={async () => {
                if (!permission?.granted) {
                  const res = await requestPermission();
                  if (!res.granted) {
                    setError('Camera access is needed to scan. You can enter the code manually below.');
                    return;
                  }
                }
                setCameraOpen(true);
              }}
              className="h-80 items-center justify-center gap-3 rounded-3xl bg-[#C9C9D4]/60 active:opacity-80">
              <View className="h-40 w-40 items-center justify-center rounded-2xl border-2 border-dashed border-white/80 bg-white/25">
                <QrCode size={110} color="#3D3D4D" />
              </View>
              <Text className="text-[13px] font-semibold text-white">
                {cameraOpen ? 'Camera ready — point at the QR' : 'Tap to open camera & scan the event QR code'}
              </Text>
              {cameraOpen ? (
                <Pressable onPress={() => setCameraOpen(false)}>
                  <Text className="text-[12px] font-semibold text-white underline">Close camera</Text>
                </Pressable>
              ) : null}
            </Pressable>
          )}

          <View className="gap-1.5">
            <Text className="text-[13px] font-semibold">Event code (manual entry)</Text>
            <View className="flex-row gap-2">
              <Input
                placeholder="e.g. evt-techfest-2025"
                placeholderTextColor={THEME.light.mutedForeground}
                autoCapitalize="none"
                value={code}
                onChangeText={setCode}
                className="h-14 flex-1 rounded-2xl bg-card text-[15px]"
              />
              <Pressable onPress={submitCode} className="justify-center rounded-2xl bg-primary px-5">
                <Text className="font-bold text-primary-foreground">Join</Text>
              </Pressable>
            </View>
          </View>

          {error ? (
            <View className="rounded-2xl border border-destructive/30 bg-destructive/5 p-3.5">
              <Text className="text-[13px] font-semibold">Invalid code</Text>
              <Text className="mt-0.5 text-[12px] text-muted-foreground">{error}</Text>
              <Pressable
                onPress={() => {
                  setError(null);
                  setLocked(false);
                }}
                className="mt-2">
                <Text className="text-[13px] font-bold text-primary">Try again</Text>
              </Pressable>
            </View>
          ) : null}

          <InfoNote text="Make sure you're scanning a valid event QR code provided by organizers." />
        </View>
      ) : (
        <View className="flex-1 gap-3 px-5 pb-6">
          {MOCK_VENUE_EVENTS.map((event) => {
            const active = activeEvent?.id === event.id;
            return (
              <View key={event.id} className="gap-1 rounded-3xl border border-border bg-card p-4">
                <Text className="text-[15px] font-bold">{event.name}</Text>
                {event.description ? (
                  <Text variant="muted" className="text-[12px]">
                    {event.description}
                  </Text>
                ) : null}
                <Pressable
                  onPress={() => {
                    joinEvent(event);
                    router.push('/event-joined');
                  }}
                  className={cn(
                    'mt-2 rounded-2xl py-3',
                    active ? 'bg-secondary' : 'bg-primary',
                  )}>
                  <Text
                    className={cn(
                      'text-center text-[14px] font-bold',
                      active ? 'text-secondary-foreground' : 'text-primary-foreground',
                    )}>
                    {active ? 'Current event ✓' : 'Join this event'}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      )}

      {/* Screen 15 — Event Found bottom sheet */}
      <AlertDialog
        open={found !== null}
        onOpenChange={(o) => {
          if (!o) {
            setFound(null);
            setLocked(false);
          }
        }}>
        <AlertDialogContent className="items-center gap-2 rounded-3xl border-border bg-card p-6">
          <AlertDialogHeader className="items-center">
            <View className="h-24 w-24 items-center justify-center rounded-full bg-[#DFF7E8]">
              <CheckCircle2 size={52} color="#1E7F4D" />
            </View>
            <AlertDialogTitle className="mt-1 text-center text-[19px] font-extrabold">
              Event Found!
            </AlertDialogTitle>
            <Text className="text-center text-[15px] font-bold">{found?.name}</Text>
            <AlertDialogDescription className="text-center">
              {ACTIVE_EVENT.venue}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="w-full flex-col gap-2">
            <AlertDialogAction
              onPress={confirmJoin}
              className="h-14 w-full rounded-2xl">
              <Text className="text-[15px] font-bold text-primary-foreground">Join Event</Text>
            </AlertDialogAction>
            <AlertDialogCancel className="w-full border-0 bg-transparent shadow-none">
              <Text className="text-[14px] text-muted-foreground">Cancel</Text>
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ScreenContainer>
  );
}
