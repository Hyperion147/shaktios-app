// Session gate: restores the Supabase session, then requires sign-in.
// Reporting is authenticated — the JWT identifies the citizen server-side.
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
        <LoadingState title="Loading ShaktiOS…" subtitle="Preparing citizen reporting" />
      </ScreenContainer>
    );
  }
  if (!user) {
    return <Redirect href="/login" />;
  }
  return <Redirect href="/(tabs)/home" />;
}
