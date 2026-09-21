import '../global.css';

import { NAV_THEME } from '@/lib/theme';
import { SessionProvider } from '@/src/store/session';
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

export default function RootLayout() {
  // Single light theme (dark mode removed from globals.css).
  return (
    <ThemeProvider value={NAV_THEME.light}>
      <StatusBar style="dark" />
      <SessionProvider>
        <DeepLinkHandler />
        <Stack
          screenOptions={{ headerShown: false }}
        />
      </SessionProvider>
      <PortalHost />
    </ThemeProvider>
  );
}
