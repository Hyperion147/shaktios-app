import '../global.css';

import { NAV_THEME } from '@/lib/theme';
import { SessionProvider, useSession } from '@/src/store/session';
import { LoadingState } from '@/src/components/States';
import { ScreenContainer } from '@/src/components/ScreenContainer';
import { useEventDeepLink } from '@/src/hooks/useEventDeepLink';
import { ThemeProvider } from 'expo-router/react-navigation';
import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export { ErrorBoundary } from 'expo-router';

function DeepLinkHandler() {
  useEventDeepLink();
  return null;
}

function SessionStack() {
  const { user, initializing } = useSession();
  if (initializing) return <ScreenContainer><LoadingState title="Restoring session…" /></ScreenContainer>;
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Protected guard={Boolean(user)}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="report" />
        <Stack.Screen name="voice-report" />
        <Stack.Screen name="report-details" />
        <Stack.Screen name="location" />
        <Stack.Screen name="review" />
        <Stack.Screen name="submitted" />
        <Stack.Screen name="report-detail" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  // Single light theme (dark mode removed from globals.css).
  return (
    <ThemeProvider value={NAV_THEME.light}>
      <StatusBar style="dark" />
      <SessionProvider>
        <DeepLinkHandler />
        <SessionStack />
      </SessionProvider>
      <PortalHost />
    </ThemeProvider>
  );
}
