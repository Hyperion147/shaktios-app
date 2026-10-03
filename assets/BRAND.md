# ShaktiOS brand assets

The existing purple shield/check is the shared ShaktiOS mark. These assets replace the React Native Reusables starter artwork without changing the app palette.

- Source: `images/shakti-mark.svg`, identical to `shakti-os/apps/dashboard/public/shakti-mark.svg` in the sibling dashboard repository. Keep both copies in sync.
- Primary: `#6468F0`; shield: white; transparent mark corners use a 20/100 radius (8px at a 40px web size).
- `shakti-mark.png`: 512px transparent in-app mark.
- `splash.png`: 512px transparent mark, **not** a full-screen background. Use splash plugin `imageWidth: 96`, `resizeMode: "contain"`, `backgroundColor: "#F6F7F9"` to match the light app.
- `icon.png`: 1024px square, opaque purple background. The OS supplies the launcher mask; no alpha channel or pre-rounded outer edge.
- `adaptive-icon.png`: 1024px transparent white-shield foreground. **Requires** Android adaptive icon `backgroundColor: "#6468F0"`. The shield stays within the Android safe area. It can also be used for `monochromeImage`.
- `favicon.png`: 64px transparent mark. The dashboard's `app/favicon.ico` contains the same mark at 16, 32, and 48px.

PNG/ICO artwork was rasterized locally from the SVG using system librsvg/Cairo; no application dependency was added. Do not edit the generated raster files independently. The unused `react-native-reusables-*.png` files are retained to avoid unrelated starter cleanup.

## Icon attribution

Shield/check geometry is adapted from the already-used Lucide `ShieldCheck` icon.

ISC License

Copyright (c) 2026 Lucide Icons and Contributors

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
