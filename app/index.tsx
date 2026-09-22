// Session gate: restores dev-auth state (optional), then enters the app.
// Reporting works WITHOUT login — auth is a future capability.
import * as React from 'react';
import { Redirect } from 'expo-router';
import { useSession } from '@/src/store/session';
import { LoadingState } from '@/src/components/States';
import { ScreenContainer } from '@/src/components/ScreenContainer';

export default function Index() {
  const { initializing } = useSession();

  if (initializing) {
    return (
      <ScreenContainer>
        <LoadingState title="Loading ShaktiOS…" subtitle="Preparing citizen reporting" />
      </ScreenContainer>
    );
  }
  return <Redirect href="/(tabs)/home" />;
}
