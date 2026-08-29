# Worklog Bridge repair 5 handoff

**Verifier report:** `0089569a75ff1f56e6aad1cf53ae623d63a05790` (`.factory/verification-5.md`)

**Release/source commit:** `dc3d4d68ab203e646d4b015f71ada614eb5e5b7e`

**Release:** [`v0.1.4`](https://github.com/B-Divyesh/sf-worklog-approval-bridge/releases/tag/v0.1.4)

**Deployment:** https://worklog-approval-bridge.sociobot.in

## Reproduced release blocker

Before repair, GitHub’s latest release was `v0.1.3`. Its annotated tag resolved to
`ae2c0d8e8e28210d5423bb8ae82b20d8d99c0daa`, eight commits behind verified candidate
`b4be2aa3a0f57a2020748be55cf3a4f6cb28c956`. Its `latest.json` had no source-commit
field. The live Download page therefore selected validly checksummed, but stale,
desktop binaries.

## Repair

- Bumped the app and package version to `0.1.4`.
- The release workflow now checks out the exact pushed or dispatched tag in every
  build and publish job. A dispatch cannot silently build the default branch.
- A single tested manifest builder now requires macOS x64, macOS arm64, Windows,
  Linux AppImage, and Linux DEB assets. It writes `SHA256SUMS` and `latest.json`
  with the full immutable source commit.
- The workflow rejects a tag/config version mismatch and verifies the published
  release, tag commit, platform matrix, manifest, and one downloaded DEB checksum.
- The Download page now uses GitHub’s CORS-safe `/releases/latest` API, resolves
  the release tag to its commit, and only exposes an asset whose URL belongs to
  that tag. It shows the short source commit and uses a new cache namespace so
  the stale one-hour `v0.1.3` cache cannot survive the deployment.
- Added `npm run verify:release` for independent live release verification.

## Exact regression coverage

- `scripts/release-provenance.test.mjs` recreates the reported stale ancestor
  (`ae2c0d8`) versus repaired candidate (`b4be2aa`) and proves it is rejected.
- `@claim:release-provenance` generates a complete five-asset fixture and proves
  that its manifest is bound to the expected tagged source commit.
- The Download-page Playwright regression mocks the GitHub release/ref APIs and
  proves the selected platform URL and displayed source SHA share the same tag.
- `.factory/claims.json` now registers the provenance claim and exact command.

## Local verification (2026-08-29)

From a clean dependency install:

```sh
npm ci
npm --prefix api ci
npm test
cargo test --manifest-path src-tauri/Cargo.toml
CI=1 npm run build:desktop
```

- Both npm installs: zero vulnerabilities.
- `npm test`: 12 Node/script tests and all 15 Chromium tests passed. This includes
  all twelve registered claims, desktop and 390 × 844 mobile routes, keyboard,
  reduced motion, offline reload, privacy request capture, approval response
  policy, console, and Axe serious/critical checks.
- Type checking and the production build passed inside `npm test`. Output is
  `dist/site`; initial JS is 12.89 KB + 1.01 KB gzip and CSS is 4.62 KB gzip.
- Rust: 2/2 Git privacy claim tests passed after installing the README-listed
  Linux Tauri headers (`glib-2.0.pc` is absent in the base worker image).
- Desktop package/consumer build passed: DEB, RPM, and AppImage version `0.1.4`.
- `/opt/fleet/lib/verify-url.sh` passed `/` and `/download` at desktop and 390 px:
  correct title/lang, one h1/main, alt/labels, and zero console errors.
- Mobile Lighthouse: performance 100, accessibility 100, best practices 100,
  SEO 100; LCP 1.4 s and CLS 0.

## Release and live evidence

- GitHub Actions run `33228940141` completed successfully: macOS x64, macOS
  arm64, Windows x64, Linux x64, and the publish job all passed.
- The public release contains Apple Silicon and Intel DMGs, Windows EXE and MSI,
  Linux AppImage and DEB, `SHA256SUMS`, and valid `latest.json`.
- `latest.json.commit`, the peeled annotated tag, `origin/main` at publication,
  and the release source are all
  `dc3d4d68ab203e646d4b015f71ada614eb5e5b7e`.
- `npm run verify:release -- --tag v0.1.4 --expected-commit dc3d4d68ab203e646d4b015f71ada614eb5e5b7e`
  passed. It downloaded `Worklog.Bridge_0.1.4_amd64.deb`; SHA-256 was
  `b49e475e6d20365b55216b028d4f75f6c2c9edb3e03b8c52747add12e2502c20`,
  matching both published metadata files.
- The repaired static site and unchanged managed API deployed successfully to
  Azure Static Web Apps deployment `3a819ace-c2a8-41a1-8a3f-e3e0354b75ce`.
- The live JavaScript SHA-256 is
  `7be04e9b323f7539a401637e0c9c567a5750a7319ce92ef7af37032c30d5eb43`,
  byte-identical to `dist/site/assets/index-DCXxLqHs.js`.
- Fresh 390 × 844 reduced-motion Chromium contexts for Linux, macOS, and Windows
  each selected a real `v0.1.4` platform asset and displayed source `dc3d4d6`,
  with no console errors.
- A live five-route 390 px pass found zero serious/critical Axe violations, no
  overflow, no unexpected request origin, and no console errors. The skip link
  was first in keyboard order; `/demo` reloaded offline from the service worker.
- The live service worker and local build both use cache
  `worklog-bridge-36deab6413e0`; its response is `no-cache` while hashed assets
  remain immutable.
- `npm run verify:live` passed the fresh approval `204` response and real 404
  routing. A live fixed-connection burst returned 400 for malformed writes 1–12,
  then 429 with `Retry-After: 60` for write 13.
- Live headers retain HSTS, `nosniff`, strict-origin referrer policy, the scoped
  GitHub/Sociobot CSP, and camera/microphone/geolocation denial.

## Needs operator action

The desktop artifacts are unsigned, as before. macOS notarization requires
`APPLE_CERTIFICATE`; Windows Authenticode requires `WINDOWS_CERT_PFX`.
