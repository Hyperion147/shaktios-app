import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { Card } from '@/src/components/Card';
import { useSession } from '@/src/store/session';
import { API_BASE_URL } from '@/src/constants/config';

/** Profile tab — Supabase session + sign out. */
export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, activeEvent } = useSession();

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <ScreenContainer>
      <Text className="pt-2 text-xl font-extrabold tracking-tight">Profile</Text>

      <View className="mt-4 gap-3">
        {user ? (
          <Card>
            <Text variant="muted" className="text-xs uppercase">Signed in as</Text>
            <Text className="text-lg font-bold">{user.name}</Text>
            <Text variant="muted">{user.email ?? ''}</Text>
          </Card>
        ) : (
          <Card>
            <Text className="font-semibold">Not signed in</Text>
            <Text variant="muted">Sign in to submit incident reports.</Text>
            <Pressable onPress={() => router.push('/login')} className="mt-3 rounded-lg bg-primary py-3">
              <Text className="text-center font-semibold text-primary-foreground">
                Sign in
              </Text>
            </Pressable>
          </Card>
        )}
        <Card>
          <Text variant="muted" className="text-xs uppercase">Event</Text>
          <Text className="font-semibold">{activeEvent?.name ?? 'None joined'}</Text>
          <Text variant="muted" className="mt-1 text-xs">API: {API_BASE_URL}</Text>
        </Card>
        <Card>
          <Text variant="muted" className="text-xs uppercase">About</Text>
          <Text>ShaktiOS Citizen Reporting.</Text>
        </Card>
        {user ? (
          <Pressable onPress={handleLogout} className="rounded-xl bg-destructive py-4">
            <Text className="text-center font-bold text-destructive-foreground">Log out</Text>
          </Pressable>
        ) : null}
      </View>
    </ScreenContainer>
  );
}
