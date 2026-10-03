# ShaktiOS Citizen App

The ShaktiOS citizen client uses [React Native](https://reactnative.dev/), [Expo](https://expo.dev/), and [React Native Reusables](https://reactnativereusables.com). Citizens join registered venues and submit human-reviewed reports through FastAPI, with either the manual form or optional Sarvam-assisted voice input.

Start with [MVP build readiness](BUILD_READINESS.md) for the current structure, checks, EAS profiles, remaining release configuration, and device acceptance checklist. Shared brand artwork is documented in [assets/BRAND.md](assets/BRAND.md).

## Getting Started

To run the development server:

```bash
    npm run dev
    # or
    yarn dev
    # or
    pnpm dev
    # or
    bun dev
```

This will start the Expo Dev Server. Open the app in:

- **iOS**: press `i` to launch in the iOS simulator _(Mac only)_
- **Android**: press `a` to launch in the Android emulator
- **Web**: press `w` to run in a browser

You can also use a matching SDK 56 [Expo Go](https://expo.dev/go) client for development. Android/web bundling is verified; native sign-in, microphone/camera/GPS permissions and real Sarvam processing still require the device smoke test. Rebuild an existing development/release binary after adding native modules or changing permission plugins.

## Configuration (ShaktiOS citizen app)

Copy the example env file and fill in your values (`.env` is gitignored, never commit it):

```bash
cp .env.example .env
```

| Variable | Purpose |
| --- | --- |
| `EXPO_PUBLIC_API_URL` | FastAPI backend base URL. Android emulator: `http://10.0.2.2:8000`; iOS simulator/web: `http://localhost:8000`; physical phone: `http://<LAN_IP>:8000` with FastAPI listening on `0.0.0.0`. Restart Expo after changing it. |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL (Auth only). |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key (safe for clients). Never use a service-role key here. |

The app submits citizen reports to `POST {API_URL}/events` with the Supabase JWT as `Authorization: Bearer`. The backend derives identity from the JWT; the client never sends user IDs.

For the Android emulator, verify the API from the emulator with `adb shell curl http://10.0.2.2:8000/health` (or open the URL in the emulator browser). Start FastAPI with `--host 0.0.0.0` when testing from a physical device.

## Real-data flows

- Email/password login and account creation use Supabase Auth. Email confirmation, if enabled in your project, is required before sign-in. No phone/Google login is advertised without an integration.
- Venue browsing, manual ID entry and QR/deep-link joining resolve `/venues` records. No mock venue or default event is selected. Native selection is persisted with SecureStore; metadata is fetched again from the API.
- Reports require a chosen venue and canonical zone. GPS is optional; the location screen displays device coordinates and links to their actual map position instead of displaying a made-up street map.
- `GET /me/reports` and `/me/reports/{id}` return only the authenticated citizen's reports. Status is derived from operator incident state, never a report-ID hash. My Reports reloads the latest 50 records on screen focus. The API supports ownership-filtered limit/offset pagination, but a load-more/pull-to-refresh history UI is not yet implemented.
- Submission confirmation and detail screens fetch the stored report ID. No fake attachments, contacts, profile stats or historical timestamps are shown. Photo upload, push notifications and emergency dispatch are not implemented or claimed.
- A backend `401` is shown as an actionable error, not an immediate forced logout while a Supabase session remains valid.

## Optional voice reporting

1. Join a registered venue, then open **Report Incident → Describe by voice**. Manual category/details/location reporting remains available.
2. Choose Auto detect or a supported language, record up to **25 seconds**, and optionally play it back. Permission is requested only when starting a recording. Backgrounding stops an active recording; leaving/discarding cleans up temporary audio.
3. Explicitly consent to sending audio/transcript to Sarvam, then tap **Process voice & preview**. Recording alone never uploads or submits a report.
4. Review the original transcript and edit the proposed category, description, registered zone and urgency. Unknown/ambiguous fields stay unselected. No GPS or identity is invented.
5. Accept the edited draft, optionally capture GPS, then inspect the complete **Review Report** screen and tick its confirmation before **Submit Report**. Only the final report fields are saved—not raw audio or the reference transcript.

Supported speech: **22 Indic languages plus English**, based on Sarvam's current model documentation. This is not a promise of every Indian language or perfect noisy/codemixed recognition; the interface itself remains English. Speech and field suggestions are input assistance, not risk scoring or emergency dispatch.

Configure `SARVAM_API_KEY` **only on the FastAPI server**, never in Expo public environment variables. The app checks `/voice/config`; an absent key or unavailable API shows setup/manual-entry guidance rather than fake transcription. Adding the server key later does not require changing this client. See [complete voice setup and API contract](../shakti-os/docs/VOICE_REPORTING.md).

### End-to-end smoke test

1. Start FastAPI on port 8000, apply Supabase migrations and run `shakti-os/scripts/seed_supabase.py --apply`. Seed venues are labelled scenarios, not real emergency registrations.
2. Run `pnpm exec expo start -c`, open Android, sign in and select a registered venue from Event Info (or scan its ID).
3. Choose a category and zone, enter a description, optionally capture GPS, submit and verify the returned ID under My Reports.
4. Sign in to the dashboard with an operator-authorized account, open the matching incident and move it to Assessing. Refresh My Reports: status must change to Under Review.
5. Reload the app: verify auth and selected venue restoration. Sign out, sign in as a different citizen and verify the first account's reports are not visible.
6. Disable the API temporarily: screens must show retry/error states, not fabricated rows or a login loop.

Checks: `pnpm run check-types`, `pnpm test`, `pnpm exec expo install --check`, and Android/web exports. The local tests cover draft validation, multipart transport, confirmation boundaries, required native dependencies and permission configuration. Run `pnpm dlx expo-doctor` as well: the remaining SDK 56/Hermes advisory is documented in [BUILD_READINESS.md](BUILD_READINESS.md). `tests/voice.browser.cjs` exercises exported web UI with synthetic sessions/API data and Chromium's fake microphone; it never contacts real providers. Bundling and mocked checks are not proof of on-device login, microphone/camera/GPS permissions, real Sarvam transcription, or responder delivery.

## Adding components

You can add more reusable components using the CLI:

```bash
npx react-native-reusables/cli@latest add [...components]
```

> e.g. `npx react-native-reusables/cli@latest add input textarea`

If you don't specify any component names, you'll be prompted to select which components to add interactively. Use the `--all` flag to install all available components at once.

## Project Features

- ⚛️ Built with [Expo Router](https://expo.dev/router)
- 🎨 Styled with [Tailwind CSS](https://tailwindcss.com/) via [Nativewind](https://www.nativewind.dev/)
- 📦 UI powered by [React Native Reusables](https://github.com/founded-labs/react-native-reusables)
- 🚀 New Architecture enabled
- 🔥 Edge to Edge enabled
- 📱 Runs on iOS, Android, and Web

## Learn More

To dive deeper into the technologies used:

- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Expo Docs](https://docs.expo.dev/)
- [Nativewind Docs](https://www.nativewind.dev/)
- [React Native Reusables](https://reactnativereusables.com)

## Deploy with EAS

The easiest way to deploy your app is with [Expo Application Services (EAS)](https://expo.dev/eas).

- [EAS Build](https://docs.expo.dev/build/introduction/)
- [EAS Updates](https://docs.expo.dev/eas-update/introduction/)
- [EAS Submit](https://docs.expo.dev/submit/introduction/)

---

If you enjoy using React Native Reusables, please consider giving it a ⭐ on [GitHub](https://github.com/founded-labs/react-native-reusables). Your support means a lot!
