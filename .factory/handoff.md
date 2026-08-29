# Worklog Bridge repair 7 handoff

**Repair version:** `0.1.6`

**Repair commit:** `2eb1c4a7fa0b09b4e4a8758c95e1c397894457fe`

**Deployed URL:** https://worklog-approval-bridge.sociobot.in

**Status:** Code, browser, accessibility, privacy, offline, source-selection, and local desktop-package repairs are complete. The live Sociobot billing product is still not registered, so its checkout endpoint remains a release blocker outside this repository.

## Repairs made

- Pro now requires a cached, valid, unexpired license verdict that is younger than 24 hours. A token alone, invalid, absent, expired, revoked, stale, or offline-unverified verdict cannot unlock Pro.
- The exact verifier sequence is covered: load once, write `definitely-not-a-license`, remove the verdict, go offline, reload, and confirm that calendar import and approval history remain locked.
- Negative hourly rates are rejected before storage, totals, exports, and approval packets. The prior value remains visible and the error is announced.
- Git collection now takes the selected Monday-to-Sunday week. ICS events are filtered to the same week. Both collectors show a keyboard-accessible selection dialog before records enter the worklog.
- CSV neutralises cells beginning with `=`, `+`, `-`, or `@` by prefixing an apostrophe.
- The Pro dialog now traps Tab/Shift+Tab, closes on Escape or backdrop click, and restores its trigger focus.
- All mobile controls, including the demo banner, wordmark, legal links, app privacy link, footer links, and skip link have at least a 44 px target (implemented at 46 px to avoid fractional layout shortfall).
- Landing sample copy now truthfully says four Git commits and two calendar events. The claim registry has coverage for those counts, privacy/no-analytics language, price/features, offline behavior, installers, and the expanded license policy. The copy audit maps factual landing/privacy copy to claims.
- Version was advanced to `0.1.6` so repaired desktop artifacts cannot be confused with `v0.1.5`.

## Verification completed

```sh
npm ci
npm --prefix api ci
npm test
cargo test --manifest-path src-tauri/Cargo.toml
CI=1 npm run build:desktop
/opt/fleet/lib/verify-url.sh http://127.0.0.1:4173 /tmp/worklog-verify
npm run verify:live
git diff --check
```

- `npm test`: 13 Node/API/script tests and 25 Chromium tests passed.
- Rust tests: 2 passed, including selected-week Git filtering and no remote access.
- Production build passed. Main JS is 42.44 KB raw / 13.96 KB gzip; CSS is 17.21 KB raw / 4.74 KB gzip.
- Local package build passed and wrote `Worklog Bridge_0.1.6_amd64.AppImage`, `Worklog Bridge_0.1.6_amd64.deb`, and `Worklog Bridge-0.1.6-1.x86_64.rpm`.
- Browser tests exercise desktop and 390 px mobile, keyboard dialogs, Axe serious/critical scans, request privacy, offline reload, service worker cache, CSV, source selection, approval receipts, and license boundaries.
- `verify-url.sh` passed locally with no console errors, one title/lang/h1/main, and complete image/button labeling.
- Static deployment succeeded through the work-order configuration (Azure Static Web Apps deployment `ba60537c-bfd7-4433-ad02-50ee6f7ed096`). The live index serves repaired asset `index-DaVWlCy_.js`.
- Post-deployment `verify-url.sh` passed in 604 ms with no console errors, one title/lang/h1/main, complete image/button labeling, and `npm run verify:live` passed the live routing and approval-identity flow.
- GitHub Actions release run `33235924523` completed successfully for `v0.1.6`. `npm run verify:release -- --tag v0.1.6 --expected-commit 5cad9b3f575059ab4330637b3dd1d132580c35c7` verified every platform artifact, manifest entry, and checksum; the published DEB SHA-256 is `4c09f2bf1fa71309d95d36960fbdd2af168bb2635879796b37adc5607aabca14`.
- A fresh Chromium visit to the live `/download` route resolved `v0.1.6` at commit `5cad9b3` with zero browser-console errors.

## Known release blocker and exact evidence

The code must continue using the Sociobot billing endpoint required by the product contract:

```text
GET https://api.sociobot.in/api/v1/products/worklog-approval-bridge/checkout
HTTP 404
{"error":"enabled factory product","status":404}
```

The public product registry does not contain `worklog-approval-bridge`. The required factory registration command (`fleet/new-paid-product.sh`) is not present in this worker image, and registering or changing the billing service is not a repository or static-site deployment action. Do not represent the `v0.1.6` site as a releasable paid product until the factory registers this slug at the Sociobot billing service and the checkout returns a hosted redirect. After registration, verify checkout and issue/verify a test license against the already-published `v0.1.6` release.

## Run and deploy

```sh
npm ci
npm test
cargo test --manifest-path src-tauri/Cargo.toml
npm run build:site
CI=1 npm run build:desktop
```

The static deployment root remains `dist/site`. The desktop release workflow remains unchanged in class: it builds macOS, Windows, and Linux artifacts on a `v*` tag. Packages are intentionally unsigned; macOS notarization needs `APPLE_CERTIFICATE` and Windows signing needs `WINDOWS_CERT_PFX`.
