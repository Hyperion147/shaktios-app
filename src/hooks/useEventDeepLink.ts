import * as React from 'react';
import * as Linking from 'expo-linking';
import { useSession } from '@/src/store/session';

/**
 * Future QR / deep-link entry: accepts `shaktios-app://event/<eventId>`
 * (QR codes encode the same `shaktios://event/<id>` payload parsed by
 * utils/qr). Validation stays backend-authoritative via validateEventId().
 * Mounted once in the root layout; no-op until links arrive.
 */
export function useEventDeepLink() {
  const { validateEventId, joinEvent } = useSession();

  React.useEffect(() => {
    const handle = (url: string | null) => {
      if (!url) return;
      const parsed = Linking.parse(url);
      const segments = parsed.path?.split('/').filter(Boolean) ?? [];
      const eventIndex = segments.findIndex((s) => s.toLowerCase() === 'event');
      const eventId =
        eventIndex >= 0 ? segments[eventIndex + 1] : parsed.queryParams?.eventId;
      if (typeof eventId === 'string' && eventId) {
        const event = validateEventId(eventId);
        if (event) joinEvent(event);
      }
    };

    Linking.getInitialURL().then(handle).catch(() => {});
    const sub = Linking.addEventListener('url', ({ url }) => handle(url));
    return () => sub.remove();
  }, [validateEventId, joinEvent]);
}
