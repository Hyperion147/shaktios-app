import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Bell,
  CalendarDays,
  FileText,
  Info,
  MapPin,
  QrCode,
  Siren,
} from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { StatusPill } from '@/src/components/design';
import { THEME } from '@/lib/theme';
import { useSession } from '@/src/store/session';
import { fetchMyReports } from '@/src/api/reports';
import { ACTIVE_EVENT, INCIDENT_CATEGORIES } from '@/src/constants/config';
import { timeAgo } from '@/src/utils/time';
import type { BackendEvent } from '@/src/types';

function displayName(email?: string | null, fallback?: string): string {
  if (fallback && fallback.trim()) return fallback;
  if (email) {
    const base = email.split('@')[0].replace(/[._-]+/g, ' ').trim();
    if (base) return base.charAt(0).toUpperCase() + base.slice(1);
  }
  return 'Rahul';
}

function categoryLabel(id: unknown): string {
  return INCIDENT_CATEGORIES.find((c) => c.id === id)?.label ?? 'Medical Emergency';
}

export default function HomeScreen() {
  const router = useRouter();
  const { user, activeEvent } = useSession();
  const [recent, setRecent] = React.useState<BackendEvent[] | null>(null);

  React.useEffect(() => {
    let mounted = true;
    fetchMyReports(5)
      .then((list) => {
        if (mounted) setRecent(list);
      })
      .catch(() => {
        if (mounted) setRecent([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const name = displayName(user?.email, user?.name);
  const eventName = activeEvent?.name ?? 'TechFest 2025';

  const grid: {
    label: string;
    sub: string;
    icon: React.ReactNode;
    route: string;
  }[] = [
    {
      label: 'Report Incident',
      sub: 'Quickly notify authorities',
      icon: <Siren size={22} color="#E5484D" />,
      route: '/report',
    },
    {
      label: 'Join Event',
      sub: 'Scan QR or select',
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
      sub: 'Details and updates',
      icon: <Info size={22} color="#12A594" />,
      route: '/event-info',
    },
  ];

  return (
    <ScreenContainer className="px-0">
      <ScrollView className="flex-1 px-5" contentContainerClassName="gap-4 pb-8">
        {/* Greeting */}
        <View className="flex-row items-center justify-between pt-2">
          <View>
            <Text className="text-[19px] font-extrabold tracking-tight">Hello, {name} 👋</Text>
            <Text variant="muted" className="text-[12px]">
              Together for a safer tomorrow
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Pressable
              accessibilityLabel="Notifications"
              className="rounded-full border border-border bg-card p-2.5">
              <Bell size={19} color={THEME.light.foreground} />
            </Pressable>
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
        </View>

        {/* Active event card */}
        <View className="gap-2 rounded-3xl bg-primary p-5">
          <View className="flex-row items-center gap-1.5">
            <CalendarDays size={13} color="#fff" />
            <Text className="text-[11px] font-bold uppercase tracking-wider text-white/85">
              Active Event
            </Text>
          </View>
          <Text className="text-[22px] font-extrabold tracking-tight text-white">{eventName}</Text>
          <View className="flex-row items-center gap-1.5">
            <MapPin size={13} color="#fff" />
            <Text className="text-[12px] text-white/90">{ACTIVE_EVENT.venue}</Text>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-[12px] text-white/90">📅 {ACTIVE_EVENT.dates}</Text>
            <Pressable
              onPress={() => router.push('/event-info')}
              className="rounded-full bg-white px-3.5 py-1.5">
              <Text className="text-[12px] font-bold text-primary">View Event</Text>
            </Pressable>
          </View>
        </View>

        {/* Action grid */}
        <View className="flex-row flex-wrap gap-3">
          {grid.map((g) => (
            <Pressable
              key={g.label}
              onPress={() => router.push(g.route as never)}
              className="min-w-[46%] flex-1 items-start gap-2 rounded-3xl border border-border bg-card p-4 active:opacity-80">
              <View className="rounded-full bg-secondary p-2">{g.icon}</View>
              <View>
                <Text className="text-[13px] font-bold leading-4">{g.label}</Text>
                <Text className="mt-0.5 text-[11px] leading-4 text-muted-foreground">{g.sub}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Recent reports */}
        <View className="flex-row items-center justify-between">
          <Text className="text-[15px] font-bold">Recent Reports</Text>
          <Pressable onPress={() => router.push('/(tabs)/reports')}>
            <Text className="text-[12px] font-semibold text-primary">View all</Text>
          </Pressable>
        </View>

        {recent === null ? (
          <View className="gap-2">
            {[0, 1].map((i) => (
              <View
                key={i}
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
        ) : recent.length === 0 ? (
          <Pressable
            onPress={() => router.push('/report')}
            className="flex-row items-center gap-3 rounded-3xl border border-border bg-card p-4 active:opacity-80">
            <View className="h-11 w-11 items-center justify-center rounded-full bg-[#FFE9E9]">
              <Siren size={20} color="#E5484D" />
            </View>
            <View className="flex-1">
              <Text className="text-[13px] font-bold">Medical Emergency</Text>
              <Text className="text-[11px] text-muted-foreground">TechFest 2025 · 2h ago</Text>
            </View>
            <StatusPill status="under_review" label="Under review" />
          </Pressable>
        ) : (
          recent.slice(0, 3).map((r) => {
            const payload = r.payload as Record<string, unknown>;
            return (
              <Pressable
                key={r.id}
                onPress={() => router.push({ pathname: '/report-detail', params: { id: r.id } })}
                className="flex-row items-center gap-3 rounded-3xl border border-border bg-card p-4 active:opacity-80">
                <View className="h-11 w-11 items-center justify-center rounded-full bg-[#FFE9E9]">
                  <Siren size={20} color="#E5484D" />
                </View>
                <View className="flex-1">
                  <Text className="text-[13px] font-bold">
                    {categoryLabel(payload.category)}
                  </Text>
                  <Text className="text-[11px] text-muted-foreground">
                    TechFest 2025 · {timeAgo(r.timestamp)}
                  </Text>
                </View>
                <StatusPill status="under_review" label="Under review" />
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
