import * as React from 'react';
import { ActivityIndicator } from 'react-native';
import { Button, type ButtonProps } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

interface Props extends ButtonProps {
  title: string;
  loading?: boolean;
}

/** Reusable primary action button across all screens. */
export function AppButton({ title, loading, disabled, ...props }: Props) {
  return (
    <Button disabled={disabled || loading} {...props}>
      {loading ? <ActivityIndicator size="small" /> : <Text>{title}</Text>}
    </Button>
  );
}
