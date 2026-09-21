import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { Card } from '@/src/components/Card';
import { useSession } from '@/src/store/session';
import { API_BASE_URL } from '@/src/constants/config';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, activeEvent, myReports } = useSession();

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <ScreenContainer>
      <Pressable onPress={() => router.back()}>
        <Text className="text-sm text-muted-foreground">‹ Back</Text>
      </Pressable>
      <Text variant="h3" className="mt-2">Profile</Text>

      <View className="mt-4 gap-3">
        <Card>
          <Text variant="muted" className="text-xs uppercase">Signed in as</Text>
          <Text className="text-lg font-bold">{user?.name ?? '—'}</Text>
          <Text variant="muted">{user?.phone ?? user?.email ?? ''}</Text>
        </Card>
        <Card>
          <Text variant="muted" className="text-xs uppercase">Session</Text>
          <Text>Event: {activeEvent?.name ?? 'none'}</Text>
          <Text>Reports this session: {myReports.length}</Text>
          <Text variant="muted" className="mt-1 text-xs">API: {API_BASE_URL}</Text>
        </Card>
        <Card>
          <Text variant="muted" className="text-xs uppercase">About</Text>
          <Text>ShaktiOS Citizen Reporting v1.0.0 — hackathon MVP.</Text>
        </Card>
        <Pressable onPress={handleLogout} className="rounded-xl bg-destructive py-4">
          <Text className="text-center font-bold text-destructive-foreground">Log out</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
