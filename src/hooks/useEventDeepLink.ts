import * as React from 'react';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useSession } from '@/src/store/session';
import { parseEventQr } from '@/src/utils/qr';

/** Open a venue link in the join screen, with visible validation and retry. */
export function useEventDeepLink() {
  const { initializing } = useSession();
  const router = useRouter();
  const [eventId, setEventId] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    const handle = (url: string | null) => {
      if (!url || !/^shaktios(?:-app)?:\/\/event\//i.test(url)) return;
      try {
        const parsed = parseEventQr(url);
        if (mounted) setEventId(parsed.eventId);
      } catch { /* Non-event links are handled by Expo Router. */ }
    };
    Linking.getInitialURL().then(handle).catch(() => {});
    const subscription = Linking.addEventListener('url', ({ url }) => handle(url));
    return () => { mounted = false; subscription.remove(); };
  }, []);

  React.useEffect(() => {
    if (initializing || !eventId) return;
    router.replace({ pathname: '/scan', params: { eventId } });
    setEventId(null);
  }, [initializing, eventId, router]);
}
