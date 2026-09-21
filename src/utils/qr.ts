// QR payload parsing — kept separate from event validation.
// The backend remains authoritative: a parsed ID means nothing until
// validated (currently against the local registry; backend registry later).
export interface ParsedEventQr {
  eventId: string;
}

export function parseEventQr(raw: string): ParsedEventQr {
  const value = raw.trim();
  if (!value) throw new Error('Empty QR code.');

  // Accept: plain event id, shaktios://event/<id>, or JSON {"eventId": "..."}.
  const schemeMatch = value.match(/^shaktios:\/\/event\/([A-Za-z0-9_-]+)\/?$/i);
  if (schemeMatch) return { eventId: schemeMatch[1] };

  if (value.startsWith('{')) {
    try {
      const parsed = JSON.parse(value) as { eventId?: unknown; event_id?: unknown; id?: unknown };
      const id = parsed.eventId ?? parsed.event_id ?? parsed.id;
      if (typeof id === 'string' && id.trim()) return { eventId: id.trim() };
    } catch {
      // fall through to invalid
    }
    throw new Error('This QR code is not a ShaktiOS event code.');
  }

  if (/^[A-Za-z0-9_-]{3,64}$/.test(value)) return { eventId: value };
  throw new Error('This QR code is not a ShaktiOS event code.');
}
