import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { formatCoords } from '@/src/utils/location';
import type { LocationState } from '@/src/utils/location';

export function LocationStatus({
  state,
  onRetry,
}: {
  state: LocationState;
  onRetry: () => void;
}) {
  if (state.status === 'idle') {
    return (
      <View className="gap-2 rounded-xl border border-dashed border-border p-4">
        <Text variant="muted">Area name is enough. Attach GPS for extra precision.</Text>
        <Pressable onPress={onRetry} className="self-start rounded-md border border-border px-4 py-2">
          <Text className="text-sm font-medium">Use my precise location</Text>
        </Pressable>
      </View>
    );
  }
  if (state.status === 'requesting') {
    return (
      <View className="rounded-xl border border-border bg-card p-4">
        <Text>Getting your location…</Text>
      </View>
    );
  }
  if (state.status === 'ready') {
    return (
      <View className="rounded-xl border border-border bg-card p-4">
        <Text className="font-semibold">Location captured</Text>
        <Text variant="muted">{formatCoords(state.location)}</Text>
      </View>
    );
  }
  return (
    <View className="gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
      <Text className="font-semibold">Location needed</Text>
      <Text className="text-sm text-muted-foreground">{state.message}</Text>
      <Pressable onPress={onRetry} className="mt-1 self-start rounded-md bg-primary px-4 py-2">
        <Text className="font-medium text-primary-foreground">Retry</Text>
      </Pressable>
    </View>
  );
}
