// Session gate: restores auth state, then routes to login or home.
import * as React from 'react';
import { Redirect } from 'expo-router';
import { useSession } from '@/src/store/session';
import { LoadingState } from '@/src/components/States';
import { ScreenContainer } from '@/src/components/ScreenContainer';

export default function Index() {
  const { initializing, user } = useSession();

  if (initializing) {
    return (
      <ScreenContainer>
        <LoadingState title="Loading ShaktiOS…" subtitle="Restoring your session" />
      </ScreenContainer>
    );
  }
  return <Redirect href={user ? '/home' : '/login'} />;
}
