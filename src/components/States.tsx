import * as React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { cn } from '@/lib/utils';
import { Text as UIText } from '@/components/ui/text';

interface Props {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

export function LoadingState({ title, subtitle, icon }: Props) {
  return (
    <View className="flex-1 items-center justify-center gap-3 px-8">
      {icon ?? <ActivityIndicator size="large" />}
      <UIText className="text-center font-semibold">{title}</UIText>
      {subtitle ? <UIText variant="muted" className="text-center">{subtitle}</UIText> : null}
    </View>
  );
}

export function EmptyState({ title, subtitle, icon, action }: Props & { action?: React.ReactNode }) {
  return (
    <View className="items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 py-10">
      {icon}
      <UIText className="text-center font-semibold">{title}</UIText>
      {subtitle ? <UIText variant="muted" className="text-center">{subtitle}</UIText> : null}
      {action}
    </View>
  );
}

export function ErrorState({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <View className="items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-8">
      <UIText className="text-center font-semibold">{title}</UIText>
      <Text className="text-center text-sm text-muted-foreground">{message}</Text>
      {onRetry ? (
        <Pressable
          onPress={onRetry}
          className={cn('mt-2 rounded-md border border-border bg-background px-4 py-2')}>
          <Text className="text-sm font-medium">Try again</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
