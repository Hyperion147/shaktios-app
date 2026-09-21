import * as React from 'react';
import { Pressable, View } from 'react-native';
import { cn } from '@/lib/utils';
import { Text } from '@/components/ui/text';
import { INCIDENT_CATEGORIES } from '@/src/constants/config';
import type { IncidentCategoryId } from '@/src/types';

export function IncidentCategorySelector({
  value,
  onChange,
}: {
  value: IncidentCategoryId;
  onChange: (id: IncidentCategoryId) => void;
}) {
  return (
    <View className="gap-2">
      {INCIDENT_CATEGORIES.map((cat) => {
        const selected = cat.id === value;
        return (
          <Pressable
            key={cat.id}
            onPress={() => onChange(cat.id)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            className={cn(
              'rounded-xl border p-3.5',
              selected ? 'border-primary bg-primary/5' : 'border-border bg-card',
            )}>
            <View className="flex-row items-center gap-3">
              <View
                className={cn(
                  'h-5 w-5 items-center justify-center rounded-full border-2',
                  selected ? 'border-primary' : 'border-muted-foreground/40',
                )}>
                {selected ? <View className="h-2.5 w-2.5 rounded-full bg-primary" /> : null}
              </View>
              <View className="flex-1">
                <Text className="font-semibold">{cat.label}</Text>
                <Text variant="muted">{cat.hint}</Text>
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
