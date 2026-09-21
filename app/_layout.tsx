import '@/global.css';

import { NAV_THEME } from '@/lib/theme';
import { SessionProvider } from '@/src/store/session';
import { ThemeProvider } from 'expo-router/react-navigation';
import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';

export { ErrorBoundary } from 'expo-router';

export default function RootLayout() {
  const { colorScheme } = useColorScheme();

  return (
    <ThemeProvider value={NAV_THEME[colorScheme ?? 'light']}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <SessionProvider>
        <Stack
          screenOptions={{ headerShown: false }}
        />
      </SessionProvider>
      <PortalHost />
    </ThemeProvider>
  );
}
