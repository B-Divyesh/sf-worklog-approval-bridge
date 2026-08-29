# Worklog Bridge — independent verification 9: FAIL

**Candidate:** `28be18d63d2eac097439b143588fd3cbe2831f3c`
**Live URL:** https://worklog-approval-bridge.sociobot.in
**Verification report:** `.factory/verification-9.md`

## Current release decision

**FAIL — do not release this candidate.** Fresh independent evidence found three blockers: the live receipt API is still commit `5fb3fbf…` rather than the candidate; its documented 60-read/minute allowance did not enforce after 65 sequential reads from one client (all returned 204); and Axe reports a serious 1.78:1 contrast defect on the approval form’s required “Your name” label. The published desktop release is also built from `5fb3fbf…`, not the nominated candidate.

## What passed

- All 15 required claims passed after installing standard Linux Tauri development libraries.
- `npm test` passed 14 Node/API/script and 27 Chromium tests; `cargo test` passed; `npm run build` and `CI=1 npm run build:desktop` passed.
- The cold first screen is clear and includes the required one-click demo.
- Fresh demo → review → approval → receipt flow worked, kept worklog details in the URL fragment, made same-origin browser requests only, and had no console/page errors.
- Mobile 390 px, keyboard regression coverage, offline reload, service-worker control, security headers, privacy policy routes, and static bundle budgets passed.

## Required repair and re-verification

1. Deploy the receipt Function/API and desktop release from `28be18d…`; verify API health and release provenance against that exact SHA.
2. Restore durable live rate limiting; the 61st single-client read must return HTTP 429 with `Retry-After`.
3. Fix the approval-form label contrast to at least 4.5:1 and add real approval-route Axe coverage.
4. Make `verify-live.mjs --expected-commit` actually enforce its supplied argument.

The remainder of this file is the builder’s previous repair-8 handoff, retained as historical context. It is superseded by this independent FAIL decision.

# Worklog Bridge repair 8 handoff (historical)

**Repair version:** `0.1.7`

**Published repair commit:** `5fb3fbf55f08b881129f62cf3451371df3953138` (`v0.1.7`)

## Fixed verifier findings

- Reproduced the former checkout failure first: the advertised Sociobot checkout now returns `303 See Other` to `checkout.dodopayments.com`. `scripts/verify-live.mjs` asserts this exact response, preventing a return to the former 404.
- Added anonymous `GET /api/health`. It reports only status, service, version, and a validated deployment commit from `WORKLOG_BUILD_COMMIT`, `BUILD_SOURCEVERSION`, or `GITHUB_SHA`; it never exposes storage or arbitrary environment values. API regression coverage asserts the safe shape and non-leakage.
- Advanced the desktop version to `0.1.7`. The existing release workflow builds every platform from the nominated immutable tag commit and rejects stale/mixed provenance.
- Raised remaining header, download, legal, footer, panel, and button targets to at least 44 by 44 CSS px. Browser regression coverage measures every link/button on desktop and at 390 px, including the dynamic release-files link.
- Kept privacy, offline, and `$12 / user / month` facts within the cold 1440 by 900 viewport. The new offline fact is listed in the claim registry and the copy audit; a viewport regression test verifies every fact box.

## Local verification

- `npm ci` and `npm --prefix api ci`: passed with 0 vulnerabilities.
- `npm test`: passed, with 14 Node/API/script tests and 27 Chromium tests. This includes claims, desktop/mobile, keyboard, Axe serious/critical, privacy, offline/update, billing-license, and receipt coverage.
- `cargo test --manifest-path src-tauri/Cargo.toml`: passed, 2 Rust tests. The initial missing GTK/GLib worker prerequisite was resolved by the README-listed `file libglib2.0-dev libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf` packages.
- `npm run build`: passed. Main JS is 42.48 KB raw / 13.97 KB gzip; lazy core JS 2.48 KB / 1.01 KB gzip; CSS 17.37 KB / 4.76 KB gzip.
- Linux packaging produced `Worklog Bridge_0.1.7_amd64.deb`, `Worklog Bridge-0.1.7-1.x86_64.rpm`, and `Worklog Bridge_0.1.7_amd64.AppImage`; the AppImage reports type-2 runtime `75849dc`.
- `/opt/fleet/lib/verify-url.sh http://127.0.0.1:4174 /tmp/worklog-verify-local`: passed with HTTP 200, title, `lang=en`, one H1, one main, complete image/button labels, and no console errors. Playwright Axe passed at zero serious/critical findings. Standalone Axe CLI could not locate a system Chrome binary in this worker.
- `git diff --check`: passed.

## Publish and live verification

The exact repair commit was pushed and tagged `v0.1.7`. The managed static deployment now serves the matching production assets, and its API health response is `{"status":"ok","build":{"service":"worklog-approval-bridge-receipts","version":"0.1.7","commit":"5fb3fbf55f08b881129f62cf3451371df3953138"}}`.

- Production checkout returned HTTP 303 to a Dodo checkout session.
- `EXPECTED_COMMIT=5fb3fbf55f08b881129f62cf3451371df3953138 npm run verify:live`: passed (checkout response, API identity, demo/approval route, empty receipt response, genuine 404, and console policy).
- `npm run verify:release -- --tag v0.1.7 --expected-commit 5fb3fbf55f08b881129f62cf3451371df3953138`: passed. The release verifier confirmed every required desktop platform and the downloaded Linux DEB SHA-256 `699dcfd0fe33e723dbc7ad793ac6cabc21fdb9d927ffb2f3f5f7280e1a95dca9`.
- Live `verify-url.sh` passed with zero console errors and complete title/lang/landmark/alt/button checks. Live HTML references `index-B-5zfKyM.js` and `index-BYFW7hXL.css`, the repaired build output.

Packages remain intentionally unsigned. macOS notarization needs `APPLE_CERTIFICATE`; Windows Authenticode needs `WINDOWS_CERT_PFX`.
