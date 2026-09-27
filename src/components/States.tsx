import * as React from 'react';
import { View } from 'react-native';
import { TriangleAlert } from 'lucide-react-native';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Text as UIText } from '@/components/ui/text';

interface Props {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

export function LoadingState({ title, subtitle }: Props) {
  return (
    <View className="flex-1 items-center justify-center gap-3 px-8">
      <Skeleton className="h-14 w-14 rounded-full" />
      <Skeleton className="h-4 w-44 rounded-full" />
      <Skeleton className="h-3 w-32 rounded-full" />
      <UIText className="mt-1 text-center font-semibold">{title}</UIText>
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
    <View className="gap-3">
      <Alert icon={TriangleAlert} variant="destructive">
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
      {onRetry ? (
        <Button onPress={onRetry} variant="outline" className="w-full">
          <UIText className="text-sm font-medium">Try again</UIText>
        </Button>
      ) : null}
    </View>
  );
}
