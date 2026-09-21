import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { AppInput } from '@/src/components/AppInput';
import { LocationStatus } from '@/src/components/LocationStatus';
import { LOCATION_PRESETS } from '@/src/constants/config';
import type { LocationState } from '@/src/utils/location';

/**
 * Combined location entry: preset zone chips + free-text label (always
 * available) + optional GPS fix (graceful denial, never blocks submit).
 */
export function LocationPicker({
  label,
  onLabelChange,
  locationState,
  onRetryLocation,
}: {
  label: string;
  onLabelChange: (value: string) => void;
  locationState: LocationState;
  onRetryLocation: () => void;
}) {
  return (
    <View className="gap-3">
      <View className="gap-2">
        <Text className="text-sm font-medium">Where is it happening?</Text>
        <View className="flex-row flex-wrap gap-2">
          {LOCATION_PRESETS.map((preset) => {
            const selected = label.trim().toLowerCase() === preset.toLowerCase();
            return (
              <Pressable
                key={preset}
                onPress={() => onLabelChange(preset)}
                className={cn(
                  'rounded-full border px-4 py-2',
                  selected ? 'border-primary bg-primary/5' : 'border-border bg-card',
                )}>
                <Text className={cn('text-sm font-medium', selected && 'font-bold')}>{preset}</Text>
              </Pressable>
            );
          })}
        </View>
        <AppInput
          label="Area / gate"
          placeholder="e.g. Gate 4"
          autoCapitalize="none"
          value={label}
          onChangeText={onLabelChange}
          hint="A plain area name is enough — the backend normalizes it."
        />
      </View>
      <View className="gap-2">
        <Text className="text-sm font-medium">Precise location (optional)</Text>
        <LocationStatus state={locationState} onRetry={onRetryLocation} />
      </View>
    </View>
  );
}
