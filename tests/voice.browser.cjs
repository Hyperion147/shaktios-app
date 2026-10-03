/*
 * Expo web voice-flow smoke test: real browser MediaRecorder, fake microphone,
 * isolated Supabase/API responses, no actual recordings or provider calls.
 * First export web, then:
 * node tests/voice.browser.cjs [playwright-module] [chromium-executable] [export-dir] [screenshot-dir]
 * The exported app is served entirely by route fixtures; no server is required.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.argv[2] || 'playwright');
try { process.loadEnvFile(path.resolve(__dirname, '../.env')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const origin = 'http://localhost:8087';
const exportDir = path.resolve(process.argv[4] || path.join(__dirname, '../dist-web'));
const screenshots = process.argv[5];
const apiOrigin = new URL(process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000').origin;
const authOrigin = new URL(process.env.EXPO_PUBLIC_SUPABASE_URL).origin;
const user = { id: 'voice-test-citizen', email: 'voice-test@example.invalid', role: 'authenticated', aud: 'authenticated', app_metadata: {}, user_metadata: {} };
const exp = Math.floor(Date.now() / 1000) + 3600;
const jwt = `${Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')}.${Buffer.from(JSON.stringify({ sub: user.id, exp, role: 'authenticated' })).toString('base64url')}.synthetic-signature`;
const session = { access_token: jwt, refresh_token: 'synthetic-refresh', token_type: 'bearer', expires_in: 3600, expires_at: exp, user };
const venue = { id: 'voice-test-venue', name: 'Voice Test Venue', description: 'Synthetic browser fixture', venue: 'Sonarpur test area', locationLabel: 'Sonarpur', status: 'active', startTime: null, endTime: null, helpline: null, zones: [{ id: 'voice_gate', label: 'Registration & Entry', latitude: 22.45, longitude: 88.42 }] };
const voiceDraft = { venue_id: venue.id, transcript: 'প্রবেশদ্বারে ভিড় হয়েছে। দ্রুত সাহায্য চাই।', language_code: 'bn-IN', fields: { category: 'crowd', description: 'প্রবেশদ্বারে ভিড় হয়েছে।', zone_id: 'voice_gate', urgency: 'high' }, warnings: ['Review every field. No report has been submitted.'], requires_confirmation: true };
const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.ttf': 'font/ttf', '.woff2': 'font/woff2' };

async function main() {
  const browser = await chromium.launch({ executablePath: process.argv[3], headless: true, args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });
  const results = [];
  async function scenario(configured, denyMicrophone = false) {
    const context = await browser.newContext({ viewport: { width: 412, height: 915 }, permissions: ['microphone'] });
    await context.addInitScript((denied) => {
      window.__voiceTestStreams = [];
      const original = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
      navigator.mediaDevices.getUserMedia = async (constraints) => {
        if (denied) throw new DOMException('Synthetic permission denial', 'NotAllowedError');
        const stream = await original(constraints);
        window.__voiceTestStreams.push(stream);
        return stream;
      };
    }, denyMicrophone);
    const state = { drafts: 0, reports: [], errors: [] };
    let savedReport;
    await context.route('**/*', async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const headers = { 'access-control-allow-origin': origin, 'access-control-allow-headers': request.headers()['access-control-request-headers'] || 'authorization,apikey,content-type,x-client-info,x-supabase-api-version', 'access-control-allow-methods': 'GET,POST,OPTIONS', 'access-control-allow-private-network': 'true' };
      if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
      if (url.origin === authOrigin) {
        if (url.pathname.endsWith('/token')) return route.fulfill({ headers, json: session });
        if (url.pathname.endsWith('/user')) return route.fulfill({ headers, json: user });
        return route.fulfill({ headers, status: 404, json: { message: 'Unknown synthetic auth route' } });
      }
      if (url.origin === apiOrigin) {
        if (url.pathname === '/venues') return route.fulfill({ headers, json: [venue] });
        if (url.pathname === `/venues/${venue.id}`) return route.fulfill({ headers, json: venue });
        if (url.pathname === '/voice/config') return route.fulfill({ headers, json: { configured, provider: 'sarvam', max_audio_seconds: 25, max_audio_bytes: 5242880, languages: [{ code: 'unknown', label: 'Auto detect' }, { code: 'bn-IN', label: 'Bengali' }] } });
        if (url.pathname === '/voice/draft') {
          assert.equal(request.method(), 'POST');
          assert.equal(request.headers().authorization, `Bearer ${jwt}`);
          assert.match(request.headers()['content-type'], /multipart\/form-data; boundary=/);
          const upload = request.postDataBuffer();
          assert(upload.length > 500, 'Expected real MediaRecorder WebM bytes');
          const body = upload.toString('latin1');
          assert(body.includes('name="audio"') && body.includes('voice.webm'));
          assert(body.includes('name="consent"\r\n\r\ntrue'));
          assert(body.includes(venue.id));
          state.drafts += 1;
          return route.fulfill({ headers, json: voiceDraft });
        }
        if (url.pathname === '/events' && request.method() === 'POST') {
          const input = request.postDataJSON();
          state.reports.push(input);
          savedReport = { ...input, id: 'voice-test-report', reporter_id: user.id, timestamp: new Date().toISOString(), incident_id: null, incident_status: null, report_status: 'submitted', venue_name: venue.name };
          return route.fulfill({ headers, status: 201, json: savedReport });
        }
        if (url.pathname === '/me/reports') return route.fulfill({ headers, json: savedReport ? [savedReport] : [] });
        if (url.pathname === '/me/reports/voice-test-report') return route.fulfill({ headers, json: savedReport });
        return route.fulfill({ status: 404, headers, json: { detail: 'Unknown synthetic API route' } });
      }
      if (url.origin === origin) {
        const relative = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'index.html';
        let file = path.resolve(exportDir, relative);
        if (!file.startsWith(`${exportDir}${path.sep}`)) return route.abort();
        if (!path.extname(file)) file += '.html';
        if (!fs.existsSync(file)) return route.fulfill({ status: 404, body: 'Fixture asset not found' });
        return route.fulfill({ contentType: types[path.extname(file)] || 'application/octet-stream', body: fs.readFileSync(file) });
      }
      return route.abort(); // Never contact Supabase, FastAPI, Sarvam or external telemetry.
    });
    const page = await context.newPage();
    page.on('pageerror', (error) => state.errors.push(error.message));
    page.setDefaultTimeout(20000);
    await page.goto(origin);
    await page.getByPlaceholder('you@mail.com').fill(user.email);
    await page.getByPlaceholder('••••••••').fill('synthetic-password-not-real');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await page.getByRole('button', { name: 'Skip for now', exact: true }).click();
    await page.getByText('Join Event', { exact: true }).first().click();
    await page.getByText('Select Event', { exact: true }).click();
    await page.getByText('Join this event', { exact: true }).click();
    await page.getByRole('button', { name: 'Go to Home', exact: true }).click();
    await page.getByText('Report Incident', { exact: true }).filter({ visible: true }).first().click();
    await page.getByRole('button', { name: 'Describe incident by voice' }).click();
    await page.getByText('Describe what you observed', { exact: true }).waitFor();
    return { context, page, state };
  }
  const save = async (page, name) => {
    if (!screenshots) return;
    fs.mkdirSync(screenshots, { recursive: true });
    await page.screenshot({ path: path.join(screenshots, `${name}.png`), fullPage: true });
  };
  try {
    const { context, page, state } = await scenario(true);
    await page.getByRole('button', { name: 'Start recording', exact: true }).click();
    await page.getByRole('button', { name: 'Stop recording', exact: true }).waitFor();
    await page.waitForTimeout(1200);
    await page.getByRole('button', { name: 'Stop recording', exact: true }).click();
    const processButton = page.getByRole('button', { name: 'Process voice & preview', exact: true });
    await processButton.waitFor();
    assert.equal(await processButton.isDisabled(), true);
    assert.equal(state.drafts, 0);
    assert.equal(state.reports.length, 0);
    results.push('Recording does not upload or submit; consent is required');
    await page.getByRole('checkbox', { name: /I agree to send/ }).click();
    await processButton.click();
    await page.getByText('Review your voice draft', { exact: true }).waitFor();
    assert.equal(state.drafts, 1);
    assert.equal(state.reports.length, 0);
    assert.equal(await page.getByText(voiceDraft.transcript, { exact: true }).count(), 1);
    await page.getByLabel('Voice report description').fill('Reviewed and corrected description');
    await page.getByRole('radio', { name: 'Medical Emergency', exact: true }).click();
    await page.getByRole('radio', { name: 'Medium', exact: true }).click();
    await save(page, 'voice-preview');
    results.push('Multipart speech result prefills an editable multilingual preview');
    await page.getByRole('button', { name: 'Use these details & continue', exact: true }).click();
    const submit = page.getByRole('button', { name: 'Submit Report', exact: true });
    await submit.waitFor();
    assert.equal(await submit.isDisabled(), true);
    assert.equal(state.reports.length, 0);
    await page.getByRole('checkbox', { name: /I reviewed and corrected/ }).click();
    assert.equal(await submit.isEnabled(), true);
    await save(page, 'voice-confirmation');
    await submit.evaluate((element) => { element.click(); element.click(); });
    await page.getByText('Report submitted', { exact: false }).first().waitFor();
    assert.equal(state.reports.length, 1);
    const payload = state.reports[0].payload;
    assert.equal(payload.description, 'Reviewed and corrected description');
    assert.equal(payload.category, 'medical');
    assert.equal(payload.urgency, 'medium');
    assert.equal(payload.venue_event_id, venue.id);
    assert.equal(state.reports[0].location, 'voice_gate');
    assert.equal(payload.latitude, null);
    assert.equal(payload.longitude, null);
    assert.equal(payload.transcript, undefined);
    assert.equal(payload.audio, undefined);
    assert.deepEqual(state.errors, []);
    results.push('Explicit confirmation sends exactly one edited report with no guessed GPS/raw audio');
    await context.close();

    const bounded = await scenario(true);
    await bounded.page.getByRole('button', { name: 'Start recording', exact: true }).click();
    await bounded.page.getByRole('button', { name: 'Stop recording', exact: true }).waitFor();
    await bounded.page.getByRole('button', { name: 'Process voice & preview', exact: true }).waitFor({ timeout: 30000 });
    await bounded.page.getByText('25s / 25s', { exact: true }).waitFor();
    await bounded.page.waitForFunction(() => window.__voiceTestStreams.length > 0 && window.__voiceTestStreams.every((stream) => stream.getTracks().every((track) => track.readyState === 'ended')));
    await bounded.page.getByRole('button', { name: 'Record again', exact: true }).click();
    await bounded.page.getByRole('button', { name: 'Stop recording', exact: true }).waitFor();
    await bounded.page.getByRole('button', { name: 'Go back', exact: true }).click();
    await bounded.page.getByText('Or select a category manually', { exact: true }).filter({ visible: true }).first().waitFor();
    await bounded.page.waitForFunction(() => window.__voiceTestStreams.every((stream) => stream.getTracks().every((track) => track.readyState === 'ended')));
    assert.equal(bounded.state.drafts, 0);
    assert.equal(bounded.state.reports.length, 0);
    results.push('25-second automatic stop and leaving the screen release microphone tracks without uploads');
    await bounded.context.close();

    const denied = await scenario(true, true);
    await denied.page.getByRole('button', { name: 'Start recording', exact: true }).click();
    await denied.page.getByText(/Microphone access was denied/).waitFor();
    assert.equal(denied.state.drafts, 0);
    assert.equal(denied.state.reports.length, 0);
    results.push('Denied microphone permission gives a manual-entry fallback');
    await denied.context.close();

    const offline = await scenario(false);
    await offline.page.getByText('Voice processing is not available yet', { exact: true }).waitFor();
    assert.equal(await offline.page.getByRole('button', { name: 'Start recording', exact: true }).isDisabled(), true);
    await save(offline.page, 'voice-not-configured');
    await offline.page.getByRole('button', { name: 'Use the manual form instead', exact: true }).click();
    await offline.page.getByText('Or select a category manually', { exact: true }).filter({ visible: true }).first().waitFor();
    assert.equal(offline.state.drafts, 0);
    assert.equal(offline.state.reports.length, 0);
    assert.deepEqual(offline.state.errors, []);
    results.push('Missing API key keeps manual reporting available without provider requests');
    await offline.context.close();
    console.log(JSON.stringify({ passed: results }, null, 2));
  } finally { await browser.close(); }
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
