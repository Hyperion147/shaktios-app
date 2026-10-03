# ShaktiOS Citizen App

This is a [React Native](https://reactnative.dev/) project built with [Expo](https://expo.dev/) and [React Native Reusables](https://reactnativereusables.com).

It was initialized using the following command, then the `Minimal (Nativewind)` template was selected when prompted:

```bash
npx @react-native-reusables/cli@latest init
```

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

You can also scan the QR code using the [Expo Go](https://expo.dev/go) app on your device. This project fully supports running in Expo Go for quick testing on physical devices.

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
- `GET /me/reports` and `/me/reports/{id}` return only the authenticated citizen's reports. Status is derived from operator incident state, never a report-ID hash. Report lists refresh on focus/pull-to-refresh and support loading more records.
- Submission confirmation and detail screens fetch the stored report ID. No fake attachments, contacts, profile stats or historical timestamps are shown. Photo upload, push notifications and emergency dispatch are not implemented or claimed.
- A backend `401` is shown as an actionable error, not an immediate forced logout while a Supabase session remains valid.

### End-to-end smoke test

1. Start FastAPI on port 8000, apply Supabase migrations and run `shakti-os/scripts/seed_supabase.py --apply`. Seed venues are labelled scenarios, not real emergency registrations.
2. Run `pnpm exec expo start -c`, open Android, sign in and select a registered venue from Event Info (or scan its ID).
3. Choose a category and zone, enter a description, optionally capture GPS, submit and verify the returned ID under My Reports.
4. Sign in to the dashboard with an operator-authorized account, open the matching incident and move it to Assessing. Refresh My Reports: status must change to Under Review.
5. Reload the app: verify auth and selected venue restoration. Sign out, sign in as a different citizen and verify the first account's reports are not visible.
6. Disable the API temporarily: screens must show retry/error states, not fabricated rows or a login loop.

Checks: `pnpm exec tsc --noEmit` and `pnpm exec expo export --platform android`. Bundling is not proof of on-device login, camera/GPS permissions, or delivery to an external responder.

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
