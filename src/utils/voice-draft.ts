import type { IncidentCategoryId, VenueEvent } from '../types';
import type { VoiceDraft, VoiceFields } from '../types/voice';

export const MAX_VOICE_SECONDS = 25;
export const MAX_VOICE_BYTES = 5 * 1024 * 1024;
export const MAX_REPORT_DESCRIPTION = 500;
const categories: readonly string[] = ['crowd', 'medical', 'lost_person', 'fire_smoke', 'suspicious', 'violence', 'infrastructure', 'other'];
const urgencies: readonly string[] = ['low', 'medium', 'high'];

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

/** Defensive boundary: stale or unexpected provider fields cannot pick another venue. */
export function parseVoiceDraft(value: unknown, venue: VenueEvent): VoiceDraft {
  const raw = object(value);
  if (raw.venue_id !== venue.id || raw.requires_confirmation !== true) {
    throw new Error('This voice draft does not match the selected event. Record again for this event.');
  }
  if (typeof raw.transcript !== 'string' || !raw.transcript.trim() || raw.transcript.length > 12000) {
    throw new Error('No usable speech was returned. Try a clearer recording or complete the form manually.');
  }
  const fields = object(raw.fields);
  const warnings = Array.isArray(raw.warnings)
    ? raw.warnings.filter((item): item is string => typeof item === 'string').slice(0, 10)
    : [];
  const category = typeof fields.category === 'string' && categories.includes(fields.category)
    ? fields.category as IncidentCategoryId : null;
  const urgency = typeof fields.urgency === 'string' && urgencies.includes(fields.urgency)
    ? fields.urgency as VoiceFields['urgency'] : null;
  const zone = venue.zones.find((item) => item.id === fields.zone_id);
  if (!category) warnings.push('Choose the incident category. It was not identified reliably.');
  if (!urgency) warnings.push('Choose the urgency; voice suggestions cannot decide this for you.');
  if (!zone) warnings.push('Select the correct registered venue zone. Location was not identified reliably.');
  const description = typeof fields.description === 'string' && fields.description.trim()
    ? fields.description.trim() : raw.transcript.trim();
  if (description.length > MAX_REPORT_DESCRIPTION) warnings.push('The description was shortened. Review it against the full transcript.');
  return {
    venue_id: venue.id,
    transcript: raw.transcript.trim(),
    language_code: typeof raw.language_code === 'string' ? raw.language_code : null,
    fields: { category, urgency, zone_id: zone?.id ?? null, description: description.slice(0, MAX_REPORT_DESCRIPTION) },
    warnings: [...new Set(warnings)],
    requires_confirmation: true,
  };
}

export function missingVoiceFields(fields: VoiceFields, venue: VenueEvent): string[] {
  const missing: string[] = [];
  if (!fields.category || !categories.includes(fields.category)) missing.push('category');
  if (!fields.description.trim()) missing.push('description');
  if (!venue.zones.some((zone) => zone.id === fields.zone_id)) missing.push('venue zone');
  if (!fields.urgency || !urgencies.includes(fields.urgency)) missing.push('urgency');
  if (venue.status === 'ended') missing.push('an active or upcoming event');
  return missing;
}

/** Only called after the citizen explicitly accepts their edited preview. */
export function confirmedVoicePatch(draft: VoiceDraft, venue: VenueEvent) {
  const fields = draft.fields;
  if (draft.venue_id !== venue.id || missingVoiceFields(fields, venue).length || !fields.category || !fields.urgency) {
    throw new Error('Review the category, description, venue zone and urgency before continuing.');
  }
  const zone = venue.zones.find((item) => item.id === fields.zone_id)!;
  return {
    category: fields.category,
    description: fields.description.trim().slice(0, MAX_REPORT_DESCRIPTION),
    zoneId: zone.id,
    locationLabel: zone.label,
    urgency: fields.urgency,
    voice: { transcript: draft.transcript, languageCode: draft.language_code },
  };
}
