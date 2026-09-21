import * as React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cn } from '@/lib/utils';

export function ScreenContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <View className={cn('flex-1 px-5 py-4', className)}>{children}</View>
    </SafeAreaView>
  );
}
