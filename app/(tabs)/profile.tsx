import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Bell,
  ChevronRight,
  CircleUserRound,
  CircleHelp,
  Info,
  Settings2,
  ShieldCheck,
  Smartphone,
} from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
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
import { useSession } from '@/src/store/session';
import { THEME } from '@/lib/theme';

/** Screen 13 — Profile / Settings. */
export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, activeEvent } = useSession();
  const [notifications, setNotifications] = React.useState(true);
  const [confirmLogout, setConfirmLogout] = React.useState(false);

  const name = user?.name
    ? user.name.charAt(0).toUpperCase() + user.name.slice(1)
    : 'Rahul Sharma';
  const email = user?.email ?? 'rahul@example.com';

  const rows: { icon: React.ReactNode; label: string; value?: string; badge?: string }[] = [
    { icon: <CircleUserRound size={19} color={THEME.light.foreground} />, label: 'Account Information' },
    {
      icon: <ShieldCheck size={19} color={THEME.light.foreground} />,
      label: 'Authentication',
      value: user?.email ?? 'Phone',
      badge: 'Verified ✓',
    },
    { icon: <Settings2 size={19} color={THEME.light.foreground} />, label: 'App Settings' },
    { icon: <CircleHelp size={19} color={THEME.light.foreground} />, label: 'Help & Support' },
    { icon: <Info size={19} color={THEME.light.foreground} />, label: 'About ShaktiOS', value: 'v1.0.0' },
  ];

  const handleLogout = async () => {
    setConfirmLogout(false);
    await logout();
    router.replace('/login');
  };

  return (
    <ScreenContainer className="px-0">
      <ScrollView className="flex-1 px-5" contentContainerClassName="gap-3 pb-8">
        <Text className="pt-2 text-[19px] font-extrabold tracking-tight">Profile</Text>

        <View className="flex-row items-center gap-3 rounded-3xl border border-border bg-card p-4">
          <Avatar alt={name} className="h-12 w-12">
            <AvatarFallback className="bg-[#EEEDFF]">
              <Text className="text-[17px] font-extrabold text-primary">
                {name.charAt(0).toUpperCase()}
              </Text>
            </AvatarFallback>
          </Avatar>
          <View className="flex-1">
            <Text className="text-[15px] font-extrabold">{name}</Text>
            <Text variant="muted" className="text-[12px]">
              {email}
            </Text>
          </View>
          <ChevronRight size={18} color={THEME.light.mutedForeground} />
        </View>

        {activeEvent ? (
          <View className="rounded-3xl bg-primary/10 p-3.5">
            <Text className="text-[12px] font-semibold text-primary">
              📍 {activeEvent.name} — joined
            </Text>
          </View>
        ) : null}

        <View className="overflow-hidden rounded-3xl border border-border bg-card">
          {rows.map((r, i) => (
            <React.Fragment key={r.label}>
              {i > 0 ? <Separator /> : null}
              <Pressable
                className="flex-row items-center gap-3 px-4 py-3.5 active:opacity-70">
                {r.icon}
                <Text className="flex-1 text-[13.5px] font-semibold">{r.label}</Text>
                {r.value && !r.badge ? (
                  <Text variant="muted" className="text-[12px]">
                    {r.value}
                  </Text>
                ) : null}
                {r.badge ? (
                  <View className="rounded-full bg-[#DFF7E8] px-2.5 py-1">
                    <Text className="text-[10px] font-bold text-[#1E7F4D]">{r.badge}</Text>
                  </View>
                ) : null}
                {r.label === 'About ShaktiOS' && r.value ? (
                  <Text variant="muted" className="text-[12px]">
                    {r.value}
                  </Text>
                ) : (
                  <ChevronRight size={16} color={THEME.light.mutedForeground} />
                )}
              </Pressable>
            </React.Fragment>
          ))}
          <Separator />
          <View className="flex-row items-center gap-3 px-4 py-3.5">
            <Bell size={19} color={THEME.light.foreground} />
            <Text className="flex-1 text-[13.5px] font-semibold">Notifications</Text>
            <Switch checked={notifications} onCheckedChange={setNotifications} />
          </View>
        </View>

        <View className="flex-row items-center gap-2 rounded-3xl border border-border bg-card px-4 py-3.5">
          <Smartphone size={18} color={THEME.light.mutedForeground} />
          <Text variant="muted" className="text-[12px]">
            ShaktiOS Citizen Reporting · v1.0.0
          </Text>
        </View>

        {user ? (
          <Pressable
            onPress={() => setConfirmLogout(true)}
            className="rounded-2xl border border-destructive/50 py-4">
            <Text className="text-center text-[14px] font-bold text-destructive">Logout</Text>
          </Pressable>
        ) : (
          <Pressable onPress={() => router.push('/login')} className="rounded-2xl bg-primary py-4">
            <Text className="text-center text-[14px] font-bold text-primary-foreground">
              Sign in
            </Text>
          </Pressable>
        )}
      </ScrollView>

      <AlertDialog open={confirmLogout} onOpenChange={setConfirmLogout}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log out?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll need to sign in again to submit incident reports.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              <Text>Stay</Text>
            </AlertDialogCancel>
            <AlertDialogAction onPress={handleLogout} className="bg-destructive">
              <Text className="text-destructive-foreground">Logout</Text>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ScreenContainer>
  );
}
