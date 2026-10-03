import * as React from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
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
import { EmptyState, ErrorState } from '@/src/components/States';
import { useSession } from '@/src/store/session';
import { fetchVenues } from '@/src/api/events';
import { normalizeError } from '@/src/api/client';
import { parseEventQr } from '@/src/utils/qr';
import { THEME } from '@/lib/theme';
import { cn } from '@/lib/utils';
import type { VenueEvent } from '@/src/types';

function formatDates(event: VenueEvent): string | null {
  if (!event.startTime && !event.endTime) return null;
  const format = (value: string | null) =>
    value
      ? new Date(value).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : null;
  const start = format(event.startTime);
  const end = format(event.endTime);
  if (start && end) return `${start} – ${end}`;
  return start ?? end;
}

function statusLabel(status: VenueEvent['status']): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

/** Join a server-registered venue by QR code or manually entered id. */
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
  const [venues, setVenues] = React.useState<VenueEvent[] | null>(null);
  const [venuesError, setVenuesError] = React.useState<string | null>(null);
  const { eventId } = useLocalSearchParams<{ eventId?: string }>();
  const focused = React.useRef(false);
  const resolving = React.useRef(false);
  const generation = React.useRef(0);
  useFocusEffect(React.useCallback(() => {
    focused.current = true;
    return () => {
      focused.current = false;
      ++generation.current;
      resolving.current = false;
      setCameraOpen(false);
      setFound(null);
      setLocked(false);
    };
  }, []));
  React.useEffect(() => {
    if (typeof eventId !== 'string') return;
    try { setCode(parseEventQr(eventId).eventId); setTab('scan'); }
    catch { setError('This link does not contain a valid event id.'); }
  }, [eventId]);

  const loadVenues = React.useCallback(async () => {
    setVenuesError(null);
    try {
      setVenues(await fetchVenues());
    } catch (e) {
      setVenuesError(normalizeError(e).message);
    }
  }, []);

  React.useEffect(() => {
    loadVenues();
  }, [loadVenues]);

  const resolve = React.useCallback(
    async (raw: string): Promise<boolean> => {
      if (resolving.current || !focused.current) return false;
      resolving.current = true;
      setLocked(true);
      const revision = ++generation.current;
      try {
        const parsed = parseEventQr(raw);
        const event = await validateEventId(parsed.eventId);
        if (!focused.current || revision !== generation.current) return false;
        if (!event) {
          setError(`Venue event "${parsed.eventId}" was not found.`);
          return false;
        }
        setError(null);
        setFound(event);
        return true;
      } catch (e) {
        if (focused.current && revision === generation.current) setError(normalizeError(e, 'Could not validate this event code.').message);
        return false;
      } finally {
        if (revision === generation.current) { resolving.current = false; setLocked(false); }
      }
    },
    [validateEventId]
  );

  const handleBarcode = async ({ data }: { data: string }) => {
    if (locked || resolving.current || found) return;
    setLocked(true);
    const ok = await resolve(data);
    if (ok) setCameraOpen(false);
    else setLocked(false);
  };

  const submitCode = async () => {
    if (!code.trim()) {
      setError('Enter the event id printed near the QR code.');
      return;
    }
    setLocked(true);
    await resolve(code.trim());
    setLocked(false);
  };

  const confirmJoin = () => {
    if (!found || found.status === 'ended') return;
    joinEvent(found);
    setFound(null);
    setCode('');
    setLocked(false);
    router.push('/event-joined');
  };

  return (
    <ScreenContainer className="px-0">
      <View className="px-5">
        <ScreenHeader title="Join Event" onBack={() => router.back()} />
      </View>

      <Tabs value={tab} onValueChange={(v) => { setCameraOpen(false); ++generation.current; resolving.current = false; setLocked(false); setTab(v as 'scan' | 'select'); }}>
        <TabsList className="mx-5 my-3 h-auto rounded-2xl bg-secondary/80 p-1.5">
          {(
            [
              { id: 'scan', label: 'Scan QR' },
              { id: 'select', label: 'Select Event' },
            ] as const
          ).map((item) => (
            <TabsTrigger
              key={item.id}
              value={item.id}
              className={cn('flex-1 rounded-2xl py-3', tab === item.id && 'bg-primary')}>
              <Text
                className={cn(
                  'text-center text-[14px] font-bold',
                  tab === item.id ? 'text-primary-foreground' : 'text-muted-foreground'
                )}>
                {item.label}
              </Text>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {tab === 'scan' ? (
        <ScrollView className="flex-1 px-5" contentContainerClassName="gap-3 pb-6" keyboardShouldPersistTaps="handled">
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
                  const revision = generation.current;
                  const result = await requestPermission();
                  if (!focused.current || revision !== generation.current) return;
                  if (!result.granted) {
                    setError('Camera access is needed to scan. Enter the event id manually below.');
                    return;
                  }
                }
                setError(null);
                setCameraOpen(true);
              }}
              className="h-80 items-center justify-center gap-3 rounded-3xl bg-[#C9C9D4]/60 active:opacity-80">
              <View className="h-40 w-40 items-center justify-center rounded-2xl border-2 border-dashed border-white/80 bg-white/25">
                <QrCode size={110} color="#3D3D4D" />
              </View>
              <Text className="text-center text-[13px] font-semibold text-white">
                Tap to open camera and scan an event QR code
              </Text>
            </Pressable>
          )}
          {cameraOpen && permission?.granted ? (
            <Pressable onPress={() => setCameraOpen(false)}>
              <Text className="text-center text-[12px] font-semibold text-primary">
                Close camera
              </Text>
            </Pressable>
          ) : null}

          <View className="gap-1.5">
            <Text className="text-[13px] font-semibold">Event id (manual entry)</Text>
            <View className="flex-row gap-2">
              <Input
                placeholder="Enter the organizer-provided event id"
                placeholderTextColor={THEME.light.mutedForeground}
                autoCapitalize="none"
                value={code}
                onChangeText={setCode}
                className="h-14 flex-1 rounded-2xl bg-card text-[15px]"
              />
              <Pressable
                disabled={locked}
                onPress={submitCode}
                className="justify-center rounded-2xl bg-primary px-5 disabled:opacity-50">
                {locked ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="font-bold text-primary-foreground">Join</Text>
                )}
              </Pressable>
            </View>
          </View>

          {error ? (
            <View className="rounded-2xl border border-destructive/30 bg-destructive/5 p-3.5">
              <Text className="text-[13px] font-semibold">Could not join event</Text>
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

          <InfoNote text="Use an event QR code or id provided by the event organizer. Linked ids require the same validation and confirmation." />
        </ScrollView>
      ) : (
        <ScrollView className="flex-1 px-5" contentContainerClassName="gap-3 pb-6">
          {venuesError ? (
            <ErrorState title="Couldn't load events" message={venuesError} onRetry={loadVenues} />
          ) : venues === null ? (
            <View className="flex-1 items-center justify-center gap-3">
              <ActivityIndicator color={THEME.light.primary} />
              <Text variant="muted">Loading events…</Text>
            </View>
          ) : venues.length === 0 ? (
            <EmptyState
              title="No events available"
              subtitle="Ask an organizer for an event QR code or id."
            />
          ) : (
            venues.map((event) => {
              const active = activeEvent?.id === event.id;
              const joinable = event.status !== 'ended';
              return (
                <View key={event.id} className="gap-1 rounded-3xl border border-border bg-card p-4">
                  <View className="flex-row items-start gap-2">
                    <View className="flex-1">
                      <Text className="text-[15px] font-bold">{event.name}</Text>
                      <Text variant="muted" className="mt-0.5 text-[12px]">
                        {event.venue}
                      </Text>
                    </View>
                    <Text className="text-[11px] font-semibold text-muted-foreground">
                      {statusLabel(event.status)}
                    </Text>
                  </View>
                  {event.description ? (
                    <Text variant="muted" className="text-[12px]">
                      {event.description}
                    </Text>
                  ) : null}
                  {formatDates(event) ? (
                    <Text variant="muted" className="text-[12px]">
                      {formatDates(event)}
                    </Text>
                  ) : null}
                  <Pressable
                    disabled={!joinable}
                    onPress={() => {
                      joinEvent(event);
                      router.push('/event-joined');
                    }}
                    className={cn(
                      'mt-2 rounded-2xl py-3',
                      !joinable ? 'bg-muted opacity-60' : active ? 'bg-secondary' : 'bg-primary'
                    )}>
                    <Text
                      className={cn(
                        'text-center text-[14px] font-bold',
                        active || !joinable
                          ? 'text-secondary-foreground'
                          : 'text-primary-foreground'
                      )}>
                      {!joinable ? 'Event ended' : active ? 'Current event ✓' : 'Join this event'}
                    </Text>
                  </Pressable>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      <AlertDialog
        open={found !== null}
        onOpenChange={(open) => {
          if (!open) {
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
              Event found
            </AlertDialogTitle>
            <Text className="text-center text-[15px] font-bold">{found?.name}</Text>
            <AlertDialogDescription className="text-center">{found?.venue}</AlertDialogDescription>
            {found?.status === 'ended' ? (
              <Text className="text-center text-[12px] text-destructive">
                This event has ended.
              </Text>
            ) : null}
          </AlertDialogHeader>
          <AlertDialogFooter className="w-full flex-col gap-2">
            <AlertDialogAction
              disabled={found?.status === 'ended'}
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
