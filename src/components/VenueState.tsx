import * as React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/src/components/States';
import { useSession } from '@/src/store/session';
import { THEME } from '@/lib/theme';

/** Refresh selected metadata on focus and distinguish failed restore from no selection. */
export function VenueState() {
  const { eventLoading, eventError, refreshEvent } = useSession();
  const router = useRouter();
  useFocusEffect(React.useCallback(() => { void refreshEvent(); }, [refreshEvent]));

  if (eventLoading) {
    return <View className="flex-row items-center gap-2 p-3"><ActivityIndicator color={THEME.light.primary} /><Text variant="muted">Refreshing event…</Text></View>;
  }
  if (!eventError) return null;
  return <View className="gap-2">
    <ErrorState title="Event information unavailable" message={eventError} onRetry={refreshEvent} />
    <Button variant="outline" onPress={() => router.push('/(tabs)/scan')}><Text>Choose another event</Text></Button>
  </View>;
}
