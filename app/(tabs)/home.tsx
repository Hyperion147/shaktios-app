import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { CalendarDays, FileText, Info, MapPin, QrCode, Siren, WifiOff } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { StatusPill } from '@/src/components/design';
import { VenueState } from '@/src/components/VenueState';
import { useSession } from '@/src/store/session';
import { fetchMyReports } from '@/src/api/reports';
import { normalizeError } from '@/src/api/client';
import { INCIDENT_CATEGORIES } from '@/src/constants/config';
import { timeAgo } from '@/src/utils/time';
import { THEME } from '@/lib/theme';
import type { CitizenReportRecord } from '@/src/types';

function displayName(name?: string, email?: string): string {
  const value = name?.trim() || email?.split('@')[0]?.trim();
  if (!value) return 'Citizen';
  return value.replace(/[._-]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function categoryLabel(id: unknown): string {
  return INCIDENT_CATEGORIES.find((item) => item.id === id)?.label ?? 'Report';
}

function eventDates(
  startTime: string | null | undefined,
  endTime: string | null | undefined
): string | null {
  if (!startTime && !endTime) return null;
  const format = (value: string | null | undefined) =>
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

function errorMessage(error: ReturnType<typeof normalizeError>): string {
  return error.code === 'unauthorized'
    ? 'The server rejected the current session. Retry once; if it persists, sign out and sign in again.'
    : error.message;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user, activeEvent } = useSession();
  const [recent, setRecent] = React.useState<CitizenReportRecord[] | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const loadRecent = React.useCallback(async () => {
    setLoadError(null);
    try {
      setRecent(await fetchMyReports(5, 0));
    } catch (e) {
      setLoadError(errorMessage(normalizeError(e)));
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      void loadRecent();
    }, [loadRecent])
  );

  const name = displayName(user?.name, user?.email);
  const dates = eventDates(activeEvent?.startTime, activeEvent?.endTime);
  const eventLocation = activeEvent?.venue ?? activeEvent?.locationLabel;

  const grid: { label: string; sub: string; icon: React.ReactNode; route: string }[] = [
    {
      label: 'Report Incident',
      sub: 'Notify the safety team',
      icon: <Siren size={22} color="#E5484D" />,
      route: '/report',
    },
    {
      label: 'Join Event',
      sub: 'Scan QR or enter an id',
      icon: <QrCode size={22} color={THEME.light.primary} />,
      route: '/(tabs)/scan',
    },
    {
      label: 'My Reports',
      sub: 'View your past reports',
      icon: <FileText size={22} color="#2F6FED" />,
      route: '/(tabs)/reports',
    },
    {
      label: 'Event Info',
      sub: 'Details and helpline',
      icon: <Info size={22} color="#12A594" />,
      route: '/event-info',
    },
  ];

  return (
    <ScreenContainer className="px-0">
      <ScrollView className="flex-1 px-5" contentContainerClassName="gap-4 pb-8">
        <View className="flex-row items-center justify-between pt-2">
          <View>
            <Text className="text-[19px] font-extrabold tracking-tight">Hello, {name} 👋</Text>
            <Text variant="muted" className="text-[12px]">
              Together for a safer tomorrow
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/(tabs)/profile')}
            accessibilityLabel="Open profile">
            <Avatar alt="Your profile" className="h-11 w-11 border border-border">
              <AvatarFallback className="bg-[#EEEDFF]">
                <Text className="text-[15px] font-extrabold text-primary">
                  {name.charAt(0).toUpperCase()}
                </Text>
              </AvatarFallback>
            </Avatar>
          </Pressable>
        </View>

        <VenueState />
        {activeEvent ? (
          <View className="gap-2 rounded-3xl bg-primary p-5">
            <View className="flex-row items-center gap-1.5">
              <CalendarDays size={13} color="#fff" />
              <Text className="text-[11px] font-bold uppercase tracking-wider text-white/85">
                Selected Event
              </Text>
            </View>
            <Text className="text-[22px] font-extrabold tracking-tight text-white">
              {activeEvent.name}
            </Text>
            <View className="flex-row items-center gap-1.5">
              <MapPin size={13} color="#fff" />
              <Text className="text-[12px] text-white/90">{eventLocation}</Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-[12px] text-white/90">{dates ?? activeEvent.status}</Text>
              <Pressable
                onPress={() => router.push('/event-info')}
                className="rounded-full bg-white px-3.5 py-1.5">
                <Text className="text-[12px] font-bold text-primary">View Event</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            onPress={() => router.push('/(tabs)/scan')}
            className="gap-2 rounded-3xl border border-border bg-card p-5">
            <Text className="text-[17px] font-extrabold">No event selected</Text>
            <Text variant="muted" className="text-[12px]">
              Join an organizer-provided event to report against a canonical venue zone.
            </Text>
            <Text className="text-[12px] font-bold text-primary">Join an event →</Text>
          </Pressable>
        )}

        <View className="flex-row flex-wrap gap-3">
          {grid.map((item) => (
            <Pressable
              key={item.label}
              onPress={() => router.push(item.route as never)}
              className="min-w-[46%] flex-1 items-start gap-2 rounded-3xl border border-border bg-card p-4 active:opacity-80">
              <View className="rounded-full bg-secondary p-2">{item.icon}</View>
              <View>
                <Text className="text-[13px] font-bold leading-4">{item.label}</Text>
                <Text className="mt-0.5 text-[11px] leading-4 text-muted-foreground">
                  {item.sub}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>

        <View className="flex-row items-center justify-between">
          <Text className="text-[15px] font-bold">Recent Reports</Text>
          <Pressable onPress={() => router.push('/(tabs)/reports')}>
            <Text className="text-[12px] font-semibold text-primary">View all</Text>
          </Pressable>
        </View>

        {recent === null && !loadError ? (
          <View className="gap-2">
            {[0, 1].map((item) => (
              <View
                key={item}
                className="flex-row items-center gap-3 rounded-3xl border border-border bg-card p-4">
                <Skeleton className="h-11 w-11 rounded-full" />
                <View className="flex-1 gap-1.5">
                  <Skeleton className="h-3.5 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </View>
                <Skeleton className="h-6 w-20 rounded-full" />
              </View>
            ))}
          </View>
        ) : loadError ? (
          <View className="gap-2 rounded-3xl border border-border bg-card p-4">
            <Alert icon={WifiOff} variant="destructive">
              <AlertTitle>Couldn’t load reports</AlertTitle>
              <AlertDescription>{loadError}</AlertDescription>
            </Alert>
            <Button onPress={loadRecent} className="h-12 w-full rounded-xl">
              <Text className="text-[14px] font-bold">Retry</Text>
            </Button>
          </View>
        ) : (recent ?? []).length === 0 ? (
          <View className="items-center gap-2 rounded-3xl border border-border bg-card px-6 py-10">
            <Text className="text-center text-[15px] font-bold">No reports yet</Text>
            <Text variant="muted" className="text-center text-[12px]">
              Reports you submit will appear here.
            </Text>
            <Pressable
              onPress={() => router.push('/report')}
              className="mt-2 rounded-2xl bg-primary px-6 py-3">
              <Text className="font-bold text-primary-foreground">Report Incident</Text>
            </Pressable>
          </View>
        ) : (
          (recent ?? []).slice(0, 3).map((report) => {
            const payload = report.payload as Record<string, unknown>;
            return (
              <Pressable
                key={report.id}
                onPress={() =>
                  router.push({ pathname: '/report-detail', params: { id: report.id } })
                }
                className="flex-row items-center gap-3 rounded-3xl border border-border bg-card p-4 active:opacity-80">
                <View className="h-11 w-11 items-center justify-center rounded-full bg-[#FFE9E9]">
                  <Siren size={20} color="#E5484D" />
                </View>
                <View className="flex-1">
                  <Text className="text-[13px] font-bold">{categoryLabel(payload.category)}</Text>
                  <Text className="text-[11px] text-muted-foreground">
                    {report.venue_name ?? 'Event unavailable'} · {timeAgo(report.timestamp)}
                  </Text>
                </View>
                <StatusPill status={report.report_status} />
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
