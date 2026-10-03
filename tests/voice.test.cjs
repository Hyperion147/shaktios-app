const test = require('node:test');
const assert = require('node:assert/strict');
const loadTs = require('./load-ts.cjs');
const { parseVoiceDraft, missingVoiceFields, confirmedVoicePatch } = loadTs('src/utils/voice-draft.ts');
const venue = { id: 'test-venue', name: 'Test venue', status: 'active', zones: [{ id: 'gate-1', label: 'Registration gate', latitude: 22.45, longitude: 88.42 }] };
const rawDraft = () => ({ venue_id: venue.id, transcript: 'প্রবেশদ্বারে অনেক ভিড়, জরুরি সাহায্য দরকার।', language_code: 'bn-IN', fields: { category: 'crowd', description: 'প্রবেশদ্বারে অনেক ভিড়।', zone_id: 'gate-1', urgency: 'high' }, warnings: [], requires_confirmation: true });

test('multilingual draft preserves spoken text and does not invent GPS or identity', () => {
  const parsed = parseVoiceDraft(rawDraft(), venue);
  assert.deepEqual(missingVoiceFields(parsed.fields, venue), []);
  const patch = confirmedVoicePatch(parsed, venue);
  assert.equal(patch.description, 'প্রবেশদ্বারে অনেক ভিড়।');
  assert.equal(patch.locationLabel, 'Registration gate');
  assert.equal(patch.voice.languageCode, 'bn-IN');
  for (const key of ['latitude', 'longitude', 'reporter_id', 'incident_id', 'risk']) assert.equal(key in patch, false);
});

test('unrecognized category, zone and urgency stay unselected instead of silently defaulting', () => {
  const raw = rawDraft();
  raw.fields = { category: 'dispatch_police', description: 'An observation', zone_id: 'other-venue-zone', urgency: 'critical' };
  const parsed = parseVoiceDraft(raw, venue);
  assert.equal(parsed.fields.category, null);
  assert.equal(parsed.fields.zone_id, null);
  assert.equal(parsed.fields.urgency, null);
  assert.deepEqual(missingVoiceFields(parsed.fields, venue), ['category', 'venue zone', 'urgency']);
  assert.throws(() => confirmedVoicePatch(parsed, venue), /Review/);
});

test('stale venue results and missing confirmation contract are rejected', () => {
  assert.throws(() => parseVoiceDraft({ ...rawDraft(), venue_id: 'other-venue' }, venue), /does not match/);
  assert.throws(() => parseVoiceDraft({ ...rawDraft(), requires_confirmation: false }, venue), /does not match/);
  assert.throws(() => confirmedVoicePatch(rawDraft(), { ...venue, id: 'other-venue' }), /Review/);
});

test('silence and invalid provider shapes cannot become a report', () => {
  assert.throws(() => parseVoiceDraft(null, venue));
  assert.throws(() => parseVoiceDraft({ ...rawDraft(), transcript: '   ' }, venue), /No usable speech/);
});

test('extraction fallback keeps the original transcript with missing fields requiring review', () => {
  const raw = rawDraft();
  raw.fields = {};
  const parsed = parseVoiceDraft(raw, venue);
  assert.equal(parsed.fields.description, raw.transcript);
  assert.equal(parsed.fields.category, null);
  assert.equal(parsed.fields.zone_id, null);
  assert.ok(parsed.warnings.length >= 3);
});

test('description shortening is visible and edits are what gets copied', () => {
  const raw = rawDraft();
  raw.fields.description = 'ক'.repeat(600);
  const parsed = parseVoiceDraft(raw, venue);
  assert.equal(parsed.fields.description.length, 500);
  assert.ok(parsed.warnings.some((warning) => warning.includes('shortened')));
  parsed.fields.description = '  Corrected observation  ';
  parsed.fields.urgency = 'low';
  const patch = confirmedVoicePatch(parsed, venue);
  assert.equal(patch.description, 'Corrected observation');
  assert.equal(patch.urgency, 'low');
});

test('removed venue zones and ended events cannot accept a previously valid voice draft', () => {
  assert.throws(() => confirmedVoicePatch(rawDraft(), { ...venue, zones: [] }), /Review/);
  assert.throws(() => confirmedVoicePatch(rawDraft(), { ...venue, status: 'ended' }), /Review/);
});

function client() {
  return loadTs('src/api/client.ts', {
    '@/src/constants/config': { API_BASE_URL: 'https://api.example.invalid', REQUEST_TIMEOUT_MS: 1000 },
    '@/src/api/supabase': { getAccessToken: async () => 'synthetic-session-token' },
  });
}

test('multipart upload retains authorization and lets fetch supply the boundary', async (t) => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => { calls.push({ url, ...options }); return new Response(JSON.stringify({ ok: true })); });
  const api = client();
  const body = new FormData();
  body.append('audio', new Blob(['synthetic audio'], { type: 'audio/webm' }), 'voice.webm');
  await api.apiRequest('/voice/draft', { method: 'POST', body });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].body, body);
  assert.equal(calls[0].headers['Content-Type'], undefined);
  assert.equal(calls[0].headers.Authorization, 'Bearer synthetic-session-token');
});

test('existing JSON report requests still serialize normally and preserve chosen urgency', async (t) => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => { calls.push({ url, ...options }); return new Response(JSON.stringify({ id: 'submitted-event' }), { status: 201 }); });
  const api = client();
  const reports = loadTs('src/api/reports.ts', {
    '@/src/api/client': api,
    '@/src/constants/config': { CITIZEN_EVENT_TYPE: 'citizen_report', CITIZEN_SOURCE: 'citizen_app' },
  });
  await reports.submitReport({ eventId: venue.id, zoneId: 'gate-1', locationLabel: 'Registration gate', category: 'crowd', description: 'Reviewed description', urgency: 'low' });
  assert.equal(calls[0].headers['Content-Type'], 'application/json');
  const body = JSON.parse(calls[0].body);
  assert.equal(body.payload.urgency, 'low');
  assert.equal(body.payload.description, 'Reviewed description');
  assert.equal(body.confidence, 0.7);
  assert.equal(body.payload.transcript, undefined);
  assert.equal(body.payload.audio, undefined);
});

test('voice transport errors are not retried and cancellation is distinguishable', async (t) => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async (_url, { signal }) => {
    calls += 1;
    return new Promise((_resolve, reject) => {
      if (signal.aborted) reject(new DOMException('Aborted', 'AbortError'));
      else signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
    });
  });
  const api = client();
  const abort = new AbortController();
  const pending = api.apiRequest('/voice/draft', { method: 'POST', body: new FormData(), signal: abort.signal });
  abort.abort();
  await assert.rejects(pending, (error) => api.normalizeError(error).code === 'cancelled');
  assert.equal(calls, 1);
  await assert.rejects(api.apiRequest('/voice/draft', { timeoutMs: 5 }), (error) => api.normalizeError(error).code === 'timeout');
  assert.equal(calls, 2);
});

test('missing provider configuration remains an actionable server error', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ detail: 'Voice processing is not configured. Use the manual form.' }), { status: 503 }));
  const api = client();
  await assert.rejects(api.apiRequest('/voice/draft'), (error) => api.normalizeError(error).status === 503 && error.message.includes('manual form'));
});
