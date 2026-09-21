import * as React from 'react';
import { TextInput, View } from 'react-native';
import { PLACEHOLDER_COLOR } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { Text } from '@/components/ui/text';

interface Props extends React.ComponentProps<typeof TextInput> {
  label: string;
  hint?: string;
  error?: string | null;
}

export function AppInput({ label, hint, error, className, ...props }: Props) {
  return (
    <View className="gap-1.5">
      <Text className="text-sm font-medium">{label}</Text>
      <TextInput
        placeholderTextColor={PLACEHOLDER_COLOR}
        className={cn(
          'rounded-lg border bg-background px-4 py-3 text-base text-foreground',
          error ? 'border-destructive' : 'border-border',
          className,
        )}
        {...props}
      />
      {error ? (
        <Text className="text-xs text-destructive">{error}</Text>
      ) : hint ? (
        <Text variant="muted">{hint}</Text>
      ) : null}
    </View>
  );
}
