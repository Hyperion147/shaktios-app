import * as React from 'react';
import { Pressable, View } from 'react-native';
import { cn } from '@/lib/utils';
import { Text } from '@/components/ui/text';

export function Card({
  children,
  className,
  onPress,
}: {
  children: React.ReactNode;
  className?: string;
  onPress?: () => void;
}) {
  const body = (
    <View className={cn('rounded-xl border border-border bg-card p-4', className)}>{children}</View>
  );
  if (onPress) {
    return (
      <Pressable onPress={onPress} className="active:opacity-80">
        {body}
      </Pressable>
    );
  }
  return body;
}

const STATUS_STYLES: Record<string, string> = {
  submitted: 'bg-secondary',
  received: 'bg-secondary',
  under_review: 'bg-secondary',
  action_initiated: 'bg-secondary',
  resolved: 'bg-secondary',
  rejected: 'bg-destructive/10',
  DETECTED: 'bg-secondary',
  ASSESSING: 'bg-secondary',
  RESPONDING: 'bg-secondary',
  RESOLVED: 'bg-secondary',
  LOW: 'bg-secondary',
  MEDIUM: 'bg-secondary',
  HIGH: 'bg-destructive/10',
  CRITICAL: 'bg-destructive/15',
};

const STATUS_LABELS: Record<string, string> = {
  submitted: 'Submitted',
  received: 'Received',
  under_review: 'Under review',
  action_initiated: 'Action initiated',
  resolved: 'Resolved',
  rejected: 'Rejected',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <View className={cn('rounded-full px-2.5 py-1', STATUS_STYLES[status] ?? 'bg-secondary')}>
      <Text className="text-xs font-semibold">
        {STATUS_LABELS[status] ?? status.replace(/_/g, ' ')}
      </Text>
    </View>
  );
}
