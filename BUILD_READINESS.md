# ShaktiOS MVP build readiness

## Verdict

The **managed Expo structure is suitable for an MVP**. Android and web exports, TypeScript, and the local tests pass. This is source/bundle evidence, **not a signed APK/AAB/IPA or an on-device voice test**. The absence of `android/` and `ios/` folders is normal for Expo Continuous Native Generation; do not generate/commit native folders just to make the repository look complete.

The API and dashboard also pass their respective tests/build checks. The backend keeps Supabase identity, incident ownership, and Sarvam credentials outside the mobile bundle.

## Checks actually verified

| Check | Result |
| --- | --- |
| Mobile TypeScript + Node tests | Passed; 12 tests |
| Expo SDK dependency check + `pnpm peers check` | Passed |
| Android + production web export | Passed; exports are not signed native artifacts |
| Voice web browser flow | 6 scenarios passed against the production export using Chromium's fake microphone and intercepted Auth/API responses |
| FastAPI | 167 tests passed, including 107 mocked voice tests; two existing deprecation warnings |
| Dashboard | 16 tests, lint, typecheck, production build and 22 browser UI/scroll/map checks passed |

The voice browser scenarios cover consent before multipart upload, multilingual/editable preview, exactly one explicit confirmed submission, 25-second automatic stop, microphone-track cleanup on exit, denied permissions and missing-key manual fallback. They do not establish actual Sarvam recognition quality or native audio behavior.

After the Metro peer repair, a stale web export produced a recoverable React Suspense hydration error. Clearing the **project bundler cache** and regenerating the production export resolved it; all six browser scenarios then passed without page errors. Use `--clear` on the first export/Metro start after a dependency-graph change, not a broad deletion of unrelated files.

## Structure and UX

| Concern | Current boundary |
| --- | --- |
| Navigation | Expo Router screens in `app/`, with report/voice routes protected by the restored Supabase session |
| Identity / selected venue / draft | `src/store/session.tsx`; native Auth and selected venue persistence use SecureStore; report drafts remain transient |
| Operational HTTP | `src/api/`; FastAPI remains authoritative, not direct Supabase table access |
| Voice recording | `src/hooks/useVoiceRecorder.ts`; foreground-only, capped at 25 seconds, temporary cache/Blob cleanup |
| Voice draft contract | `src/types/voice.ts`, `src/utils/voice-draft.ts`; missing/invalid fields stay unselected |
| Voice preview | `src/components/VoiceDraftPreview.tsx`; editable category, description, zone and urgency |
| Final submission | `app/review.tsx`; voice-derived reports require a separate review confirmation before `POST /events` |
| Visual assets | One shield/check mark across app and dashboard; native launcher/adaptive/splash/favicon assets described in `assets/BRAND.md` |
| Radius hierarchy | Compact 4–12px web controls/panels; larger mobile touch targets retained intentionally |

Manual reporting remains a first-class alternative. Voice cannot invent GPS or caller identity, choose a different venue, submit a report by itself, or dispatch a response. All eight category meanings and existing Lucide functional icons are retained. Low/medium/high urgency is now preserved in the report payload instead of collapsing low/medium into `normal`.

## What is prepared

- `eas.json`: an internal Android APK `preview` profile and a `production` profile with automatic version increments.
- `app.json`: ShaktiOS display name, light theme, consistent native art, and the microphone usage explanation.
- `expo-audio` / `expo-file-system`: SDK-compatible versions, no deprecated `expo-av` dependency.
- `@react-native/metro-config` is pinned to **0.85.3**, matching React Native's CLI peer. This fixes the observed auto-installed **0.87.1** mismatch without changing the Expo/React Native versions; `pnpm peers check` now passes.
- Background recording/playback are disabled. Native config tests verify the microphone permission survives plugin composition and that audio foreground-service/background-mode permissions are absent.
- Camera and audio plugins share the same iOS microphone-purpose text. Setting the camera plugin's microphone permission to `false` can remove the audio plugin's required Info.plist key; do not do that while voice is enabled.
- The Sarvam key is **server-only**. A mobile rebuild is not needed just to add/change it on an already compatible backend.

## Still required before a distributable build

1. **Choose application identities you intend to own.** Set `expo.android.package` and `expo.ios.bundleIdentifier` in `app.json`. They are deliberately not invented here. Expo introspection currently supplies `com.placeholder.appid`; that is not a release identity.
2. **Link the intended EAS project/account and signing credentials.** No account login, remote build, project creation, or signing operation was performed. EAS can guide this interactively:

   ```powershell
   pnpm dlx eas-cli login
   pnpm dlx eas-cli init
   ```

3. **Configure reachable public build-time endpoints** in the matching EAS `preview` / `production` environment:
   - `EXPO_PUBLIC_API_URL`: your deployed HTTPS FastAPI origin.
   - `EXPO_PUBLIC_SUPABASE_URL`: the same Supabase project used by FastAPI.
   - `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: publishable/anon key only.

   The current `http://10.0.2.2:8000` fallback is **Android-emulator-only**. It is not suitable for a physical-device or release build. Do not ship a placeholder host or weaken production network security to conceal an unreachable API. Expo embeds these values at build/export time. Configure web CORS for the actual web origin if exporting web.
4. **Build and install the actual artifact** after those choices:

   ```powershell
   pnpm dlx eas-cli build --platform android --profile preview
   # Production store artifact, only once release configuration is ready:
   pnpm dlx eas-cli build --platform android --profile production
   ```

5. **Run the native smoke test** below. Cloud compilation alone does not verify permissions, persistence, microphone codecs, external billing, or user comprehension.

A Sarvam key is not required to compile or use manual reporting. It is required to enable real voice processing. Setup and privacy details: [Voice reporting](../shakti-os/docs/VOICE_REPORTING.md).

## Repeatable local checks

```powershell
pnpm install --frozen-lockfile
pnpm run check-types
pnpm test
pnpm exec expo install --check
pnpm peers check
pnpm exec expo export --platform android --clear --output-dir dist-android
pnpm exec expo export --platform web --clear --output-dir dist-web
```

`dist-android/` and `dist-web/` are ignored generated output. The current mobile tests use Node's built-in runner plus in-memory TypeScript compilation; no additional test framework or production test bypass is installed. There is no separate mobile lint script; do not report one as passed.

For the real-browser UI smoke test, first export web, then use an existing Playwright/Chromium installation:

```powershell
node tests/voice.browser.cjs <PLAYWRIGHT_MODULE_PATH> <CHROMIUM_EXECUTABLE_PATH> dist-web <OPTIONAL_TEMP_SCREENSHOT_DIR>
```

This serves exported assets using browser route fixtures, uses Chromium's **fake microphone**, and intercepts every Auth/API request. It does not contact actual Supabase/FastAPI/Sarvam or record a person. It exercises the UI and web MediaRecorder, not a native codec or real speech model.

## Native acceptance checklist

- Sign in, force-close/reopen, and confirm the correct user and selected venue restore.
- Join a registered venue and open **Report Incident → Describe by voice**.
- Deny microphone permission: see actionable settings/manual-form guidance. Then grant it.
- Record a short Hindi/Bengali/another supported-language observation. Stop manually and test the 25-second automatic limit, interruption/backgrounding, re-record, playback, and leaving the screen.
- Confirm no audio uploads before the consent checkbox and **Process voice & preview** action.
- Verify real Sarvam transcription/field extraction after configuring the backend key; exercise silence, slow/offline requests, invalid credentials and provider quota failures.
- Verify omitted/ambiguous zones or categories remain unselected. Edit every proposed field and confirm the canonical zone belongs to the selected venue.
- Attach GPS only through the explicit device-location action, or continue without GPS.
- Check all final data, tick the review confirmation, submit once, and read back the stored report under the same citizen account.
- Switch accounts/venues during a draft and confirm there is no stale audio, preview or cross-account report access.

## Deliberate MVP limits

- Supported **22 Indic languages plus English**, not every language spoken in India. Mixed speech/noisy crowds require human review. The interface itself is not fully localized.
- Recordings are bounded; there is no offline speech model or upload queue. Device cache cleanup is best effort; provider retention policies also apply.
- Sarvam availability/quality/latency and native Android/iOS behavior remain unverified without a real key and physical-device run.
- Backend voice limits are process-local; public multi-worker deployment needs shared rate limits and ingress controls. Review privacy/consent policies before collecting sensitive audio.
- Existing operational limitations still apply: no certified emergency dispatch, bounded report history, and no general action idempotency or durable multi-process realtime.
