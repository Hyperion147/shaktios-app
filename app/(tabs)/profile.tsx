import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CircleUserRound, ShieldCheck, Smartphone } from 'lucide-react-native';
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
import { Text } from '@/components/ui/text';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { useSession } from '@/src/store/session';
import { THEME } from '@/lib/theme';

function displayName(name?: string, email?: string): string {
  const value = name?.trim() || email?.split('@')[0]?.trim();
  if (!value) return 'Citizen';
  return value.replace(/[._-]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

/** Account summary and the one supported account action: sign out. */
export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, activeEvent } = useSession();
  const [confirmLogout, setConfirmLogout] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const name = displayName(user?.name, user?.email);

  const handleLogout = async () => {
    setConfirmLogout(false);
    try {
      await logout();
      router.replace('/login');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not sign out. Please retry.');
    }
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
              {user?.email ?? 'No email available'}
            </Text>
          </View>
        </View>

        {activeEvent ? (
          <View className="rounded-3xl bg-primary/10 p-3.5">
            <Text className="text-[12px] font-semibold text-primary">
              Selected event: {activeEvent.name}
            </Text>
          </View>
        ) : null}

        <View className="overflow-hidden rounded-3xl border border-border bg-card">
          <View className="flex-row items-center gap-3 px-4 py-3.5">
            <CircleUserRound size={19} color={THEME.light.foreground} />
            <View className="flex-1">
              <Text className="text-[13.5px] font-semibold">Account</Text>
              <Text variant="muted" className="text-[12px]">
                {user?.email ?? 'Email account'}
              </Text>
            </View>
          </View>
          <Separator />
          <View className="flex-row items-center gap-3 px-4 py-3.5">
            <ShieldCheck size={19} color={THEME.light.foreground} />
            <View className="flex-1">
              <Text className="text-[13.5px] font-semibold">Authentication</Text>
              <Text variant="muted" className="text-[12px]">
                Email and password via Supabase
              </Text>
            </View>
          </View>
          <Separator />
          <View className="flex-row items-center gap-3 px-4 py-3.5">
            <Smartphone size={19} color={THEME.light.mutedForeground} />
            <View className="flex-1">
              <Text className="text-[13.5px] font-semibold">ShaktiOS Citizen Reporting</Text>
              <Text variant="muted" className="text-[12px]">
                Mobile reporting app
              </Text>
            </View>
          </View>
        </View>

        {error ? <Text className="text-destructive">{error}</Text> : null}
        {user ? (
          <Pressable
            onPress={() => setConfirmLogout(true)}
            className="rounded-2xl border border-destructive/50 py-4">
            <Text className="text-center text-[14px] font-bold text-destructive">Sign out</Text>
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
            <AlertDialogTitle>Sign out?</AlertDialogTitle>
            <AlertDialogDescription>
              You will need to sign in again to submit reports.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              <Text>Stay</Text>
            </AlertDialogCancel>
            <AlertDialogAction onPress={handleLogout} className="bg-destructive">
              <Text className="text-destructive-foreground">Sign out</Text>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ScreenContainer>
  );
}
