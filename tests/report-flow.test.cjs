const test = require('node:test');
const assert = require('node:assert/strict');
const loadTs = require('./load-ts.cjs');

const venue = { id: 'test-venue', name: 'Test venue', status: 'active', zones: [{ id: 'gate-1', label: 'Registration gate' }] };

function priorityClient(handler) {
  return loadTs('src/api/priority.ts', {
    './client': {
      apiRequest: async (path, options) => handler(path, options),
    },
  });
}

test('priority assist accepts a validated Sarvam suggestion', async () => {
  const api = priorityClient(async (path, options) => {
    assert.equal(path, '/priority/assess');
    assert.equal(options.method, 'POST');
    assert.deepEqual(options.body, { category: 'crowd', description: 'Heavy pushing near gate.', has_photo: true });
    return { suggested_urgency: 'high', priority: true, reasons: ['Mentions pushing'] };
  });
  const assessment = await api.assessPriority({ category: 'crowd', description: 'Heavy pushing near gate.', hasPhoto: true });
  assert.deepEqual(assessment, { suggested_urgency: 'high', priority: true, reasons: ['Mentions pushing'] });
});

test('priority assist rejects malformed suggestions and empty text', async () => {
  const api = priorityClient(async () => ({ suggested_urgency: 'critical', priority: 'yes', reasons: [{}] }));
  await assert.rejects(api.assessPriority({ category: 'crowd', description: 'Heavy pushing near gate.', hasPhoto: false }), /manually/);
  await assert.rejects(api.assessPriority({ category: 'crowd', description: '   ', hasPhoto: false }), /short description/);
});

test('submitted reports carry compressed photo URLs alongside auto GPS', async () => {
  const calls = [];
  const api = {
    apiRequest: async (path, options) => { calls.push({ path, body: options.body }); return { id: 'event-1' }; },
  };
  const reports = loadTs('src/api/reports.ts', {
    '@/src/api/client': api,
    '@/src/constants/config': { CITIZEN_EVENT_TYPE: 'citizen_report', CITIZEN_SOURCE: 'citizen_app' },
  });
  await reports.submitReport({
    eventId: venue.id, zoneId: 'gate-1', locationLabel: 'Registration gate', category: 'crowd',
    description: 'Heavy pushing.', urgency: 'high', latitude: 22.45, longitude: 88.42, accuracy: 12,
    photo_urls: ['https://cdn.example/evidence/a.jpg', 'not-a-url', 'https://cdn.example/evidence/b.jpg'],
  });
  assert.equal(calls.length, 1);
  const payload = calls[0].body.payload;
  assert.deepEqual(payload.photo_urls, ['https://cdn.example/evidence/a.jpg', 'https://cdn.example/evidence/b.jpg']);
  assert.equal(payload.latitude, 22.45);
  assert.equal(payload.urgency, 'high');
});

test('auto-attach GPS only uses fresh fixes', () => {
  const location = loadTs('src/utils/location.ts', { 'expo-location': {} });
  const now = Date.now();
  assert.equal(location.isLocationFresh(new Date(now - 60_000).toISOString(), 15 * 60 * 1000, now), true);
  assert.equal(location.isLocationFresh(new Date(now - 60 * 60 * 1000).toISOString(), 15 * 60 * 1000, now), false);
  assert.equal(location.isLocationFresh(new Date(now + 60_000).toISOString(), 15 * 60 * 1000, now), false);
  assert.equal(location.isLocationFresh(null), false);
  assert.equal(location.isLocationFresh('not-a-date'), false);
});
